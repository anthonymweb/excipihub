from django.utils import timezone
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from audit.models import log as audit_log
from logistics.models import Shipment, ShipmentEvent

from .models import Dispute, Order, OrderItem, Payment, Review
from .serializers import (
    DisputeSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    ReviewSerializer,
    SellerOrderItemSerializer,
)


class IsSellerOrderItemOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return obj.excipient.seller_id == request.user.id


class OrderViewSet(viewsets.ModelViewSet):
    """
    A buyer only ever sees their own orders. Creating an order builds
    its line items in the same request (see OrderCreateSerializer).
    Orders aren't editable or deletable via the API once placed —
    status changes happen through admin/staff tooling instead.
    """

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).prefetch_related("items", "disputes")

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    @action(detail=True, methods=["post"], url_path="raise-dispute")
    def raise_dispute(self, request, pk=None):
        order = self.get_object()
        if order.buyer != request.user and not request.user.is_staff:
            return Response({"detail": "Not authorized."}, status=403)

        serializer = DisputeSerializer(
            data={"order": order.id, **request.data},
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(raised_by=request.user)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["post"], url_path="confirm-delivery")
    def confirm_delivery(self, request, pk=None):
        order = self.get_object()
        if order.buyer != request.user:
            return Response({"detail": "Not authorized."}, status=403)
        if order.status != Order.Status.BUYER_CONFIRMED:
            order.status = Order.Status.BUYER_CONFIRMED
            order.save(update_fields=["status"])
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="pay")
    def pay(self, request, pk=None):
        """Simulated payment capture. Moves an unpaid order from
        PENDING_PAYMENT to PAYMENT_CONFIRMED and records the payment."""
        order = self.get_object()
        if order.buyer != request.user and not request.user.is_staff:
            return Response({"detail": "Not authorized."}, status=403)
        if order.status != Order.Status.PENDING_PAYMENT:
            return Response({"detail": "This order is not awaiting payment."}, status=400)

        payment = getattr(order, "payment", None)
        if payment:
            payment.status = Payment.Status.PROCESSING
            payment.save(update_fields=["status"])

        if payment:
            payment.status = Payment.Status.PAID
            payment.paid_at = timezone.now()
            payment.transaction_ref = f"PAY-{order.id.hex[:12]}"
            payment.save(update_fields=["status", "paid_at", "transaction_ref"])

        order.status = Order.Status.PAYMENT_CONFIRMED
        order.save(update_fields=["status"])

        audit_log(
            "PAYMENT_CAPTURED",
            request.user,
            "Order",
            order.id,
            details={"amount": str(order.total_amount)},
            request=request,
        )
        return Response(OrderSerializer(order).data)


class DisputePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.raised_by_id == request.user.id


class DisputeViewSet(viewsets.ModelViewSet):
    serializer_class = DisputeSerializer
    permission_classes = [DisputePermission]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Dispute.objects.select_related("order", "raised_by").all()
        return Dispute.objects.select_related("order", "raised_by").filter(raised_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(raised_by=self.request.user)


class SellerOrderItemViewSet(viewsets.ModelViewSet):
    serializer_class = SellerOrderItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsSellerOrderItemOwner]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return OrderItem.objects.filter(excipient__seller=self.request.user).select_related(
            "order", "excipient", "order__buyer"
        )

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get("tracking_number") and not instance.shipped_at:
            serializer.validated_data["shipped_at"] = serializer.validated_data.get("shipped_at") or timezone.now()
        updated = serializer.save()

        order = updated.order
        if updated.shipped_at and order.status in (
            Order.Status.CONFIRMED,
            Order.Status.BATCH_ALLOCATED,
            Order.Status.QC_RELEASE,
            Order.Status.PREPARING,
            Order.Status.PACKED,
        ):
            order.status = Order.Status.SHIPPED
            order.save(update_fields=["status"])

        return Response(self.get_serializer(updated).data)


class SellerOrderPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in {"manufacturer", "distributor"}
        )


class SellerOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Suppliers see every order containing their products and can advance
    its status through the fulfilment workflow."""

    serializer_class = OrderSerializer
    permission_classes = [SellerOrderPermission]

    def get_queryset(self):
        return (
            Order.objects.filter(items__excipient__seller=self.request.user)
            .distinct()
            .prefetch_related("items", "items__excipient", "buyer")
        )

    @action(detail=True, methods=["post"], url_path="set-status")
    def set_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")
        valid = [s[0] for s in Order.Status.choices]
        if new_status not in valid:
            return Response({"detail": f"Invalid status. Choose from {valid}"}, status=400)

        old = order.status
        order.status = new_status
        order.save(update_fields=["status"])

        # Auto-create a shipment record when an order is shipped.
        if new_status == Order.Status.SHIPPED:
            shipment, _ = Shipment.objects.get_or_create(order=order)
            shipment.status = Shipment.Status.SHIPPED
            shipment.carrier = request.data.get("carrier", shipment.carrier)
            shipment.tracking_number = request.data.get("tracking_number", shipment.tracking_number)
            shipment.shipment_date = timezone.now()
            shipment.save()
            ShipmentEvent.objects.create(
                shipment=shipment, event_type="shipped", description=f"Order shipped by {request.user.username}."
            )

        audit_log(
            "ORDER_STATUS_CHANGED",
            request.user,
            "Order",
            order.id,
            details={"from": old, "to": new_status},
            request=request,
        )
        return Response(OrderSerializer(order).data)


class ReviewPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.reviewer_id == request.user.id


class ReviewViewSet(viewsets.ModelViewSet):
    """Buyers leave a rating + comment on a completed order. Staff can see
    and remove any review (moderation)."""

    serializer_class = ReviewSerializer
    permission_classes = [ReviewPermission]
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Review.objects.select_related("order", "reviewer").all()
        return Review.objects.filter(reviewer=self.request.user).select_related("order", "reviewer")

    def perform_create(self, serializer):
        order = serializer.validated_data.get("order")
        if order.buyer != self.request.user:
            raise serializers.ValidationError("You can only review your own orders.")
        if order.status not in (
            Order.Status.DELIVERED,
            Order.Status.BUYER_CONFIRMED,
            Order.Status.COMPLETED,
        ):
            raise serializers.ValidationError("You can only review completed orders.")
        if hasattr(order, "review"):
            raise serializers.ValidationError("This order has already been reviewed.")
        serializer.save(reviewer=self.request.user)

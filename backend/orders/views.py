from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Dispute, Order, OrderItem
from .serializers import (
    DisputeSerializer,
    OrderCreateSerializer,
    OrderSerializer,
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
        if updated.shipped_at and order.status == Order.Status.CONFIRMED:
            order.status = Order.Status.OUT_FOR_DELIVERY
            order.save(update_fields=["status"])

        return Response(self.get_serializer(updated).data)

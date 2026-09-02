from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from catalog.models import Excipient

from .models import Dispute, Order, OrderItem, Payment, Review


class OrderItemWriteSerializer(serializers.Serializer):
    """What the frontend sends per line when placing an order — just the
    product and quantity. Price is looked up server-side so a buyer can't
    submit a tampered price."""

    excipient = serializers.PrimaryKeyRelatedField(queryset=Excipient.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["amount", "method", "status", "transaction_ref", "paid_at"]
        read_only_fields = fields


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.username", read_only=True)
    order_id = serializers.UUIDField(source="order.id", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "order", "order_id", "reviewer", "reviewer_name", "rating", "comment", "created_at"]
        read_only_fields = ["id", "reviewer", "reviewer_name", "order_id", "created_at"]
        extra_kwargs = {"order": {"write_only": True, "required": True}}


class OrderItemSerializer(serializers.ModelSerializer):
    excipient_name = serializers.CharField(source="excipient.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "excipient",
            "excipient_name",
            "quantity",
            "unit_price_at_purchase",
            "batch_number",
            "coa_url",
            "sds_url",
            "tracking_number",
            "shipped_at",
        ]
        read_only_fields = fields


class SellerOrderItemSerializer(serializers.ModelSerializer):
    order_id = serializers.UUIDField(source="order.id", read_only=True)
    order_status = serializers.CharField(source="order.status", read_only=True)
    buyer_name = serializers.CharField(source="order.buyer.username", read_only=True)
    excipient_name = serializers.CharField(source="excipient.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "order_id",
            "order_status",
            "buyer_name",
            "excipient",
            "excipient_name",
            "quantity",
            "unit_price_at_purchase",
            "batch_number",
            "coa_url",
            "sds_url",
            "tracking_number",
            "shipped_at",
        ]
        read_only_fields = [
            "id",
            "order_id",
            "order_status",
            "buyer_name",
            "excipient",
            "excipient_name",
            "quantity",
            "unit_price_at_purchase",
        ]


class OrderSerializer(serializers.ModelSerializer):
    """Read shape — nested items, resolved names, for displaying an
    order in full."""

    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    review = ReviewSerializer(read_only=True)
    has_active_dispute = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "buyer",
            "delivery_address",
            "status",
            "total_amount",
            "payment",
            "review",
            "notes",
            "items",
            "has_active_dispute",
            "created_at",
        ]
        read_only_fields = ["id", "buyer", "status", "total_amount", "created_at", "has_active_dispute"]

    def get_has_active_dispute(self, obj):
        return obj.disputes.filter(status__in=[obj.disputes.model.Status.OPEN, obj.disputes.model.Status.INVESTIGATING]).exists()


class DisputeSerializer(serializers.ModelSerializer):
    raised_by_name = serializers.CharField(source="raised_by.username", read_only=True)
    order_id = serializers.UUIDField(source="order.id", read_only=True)

    class Meta:
        model = Dispute
        fields = [
            "id",
            "order",
            "order_id",
            "raised_by",
            "raised_by_name",
            "reason",
            "status",
            "outcome",
            "resolution",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "raised_by",
            "raised_by_name",
            "order_id",
            "created_at",
            "updated_at",
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Write shape — accepts a list of {excipient, quantity} items
    alongside the order, and builds the order + line items + total in
    one transaction so they can never end up half-created."""

    items = OrderItemWriteSerializer(many=True, write_only=True)
    payment_method = serializers.CharField(write_only=True, default="card")

    class Meta:
        model = Order
        fields = ["id", "delivery_address", "notes", "items", "payment_method"]
        read_only_fields = ["id"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("An order needs at least one item.")

        quantities_by_excipient = {}
        for item in items:
            excipient = item["excipient"]
            quantities_by_excipient.setdefault(excipient.pk, 0)
            quantities_by_excipient[excipient.pk] += item["quantity"]

        errors = {}
        for excipient_id, total_qty in quantities_by_excipient.items():
            excipient = Excipient.objects.get(pk=excipient_id)
            if total_qty > excipient.stock_quantity:
                errors[str(excipient_id)] = (
                    f"Only {excipient.stock_quantity} units of {excipient.name} are available."
                )
        if errors:
            raise serializers.ValidationError({"items": errors})

        return items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        buyer = self.context["request"].user

        total = 0
        order = Order.objects.create(buyer=buyer, total_amount=0, status=Order.Status.PENDING_PAYMENT, **validated_data)

        for item in items_data:
            excipient = item["excipient"]
            quantity = item["quantity"]
            OrderItem.objects.create(
                order=order,
                excipient=excipient,
                quantity=quantity,
                unit_price_at_purchase=excipient.unit_price,
            )
            excipient.stock_quantity -= quantity
            excipient.save(update_fields=["stock_quantity"])
            total += excipient.unit_price * quantity

        order.total_amount = total
        order.save(update_fields=["total_amount"])

        payment_method = validated_data.pop("payment_method", "card")
        Payment.objects.create(
            order=order,
            amount=total,
            method=payment_method,
            status=Payment.Status.PENDING,
        )

        return order

    def to_representation(self, instance):
        # Return the full read shape (with resolved items) after creation.
        return OrderSerializer(instance).data

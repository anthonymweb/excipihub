from django.db import transaction
from rest_framework import serializers

from catalog.models import Excipient

from .models import Order, OrderItem


class OrderItemWriteSerializer(serializers.Serializer):
    """What the frontend sends per line when placing an order — just the
    product and quantity. Price is looked up server-side so a buyer can't
    submit a tampered price."""

    excipient = serializers.PrimaryKeyRelatedField(queryset=Excipient.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class OrderItemSerializer(serializers.ModelSerializer):
    excipient_name = serializers.CharField(source="excipient.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "excipient", "excipient_name", "quantity", "unit_price_at_purchase"]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    """Read shape — nested items, resolved names, for displaying an
    order in full."""

    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "buyer",
            "delivery_address",
            "status",
            "total_amount",
            "notes",
            "items",
            "created_at",
        ]
        read_only_fields = ["id", "buyer", "status", "total_amount", "created_at"]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Write shape — accepts a list of {excipient, quantity} items
    alongside the order, and builds the order + line items + total in
    one transaction so they can never end up half-created."""

    items = OrderItemWriteSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ["id", "delivery_address", "notes", "items"]
        read_only_fields = ["id"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("An order needs at least one item.")
        return items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        buyer = self.context["request"].user

        total = 0
        order = Order.objects.create(buyer=buyer, total_amount=0, **validated_data)

        for item in items_data:
            excipient = item["excipient"]
            quantity = item["quantity"]
            OrderItem.objects.create(
                order=order,
                excipient=excipient,
                quantity=quantity,
                unit_price_at_purchase=excipient.unit_price,
            )
            total += excipient.unit_price * quantity

        order.total_amount = total
        order.save(update_fields=["total_amount"])
        return order

    def to_representation(self, instance):
        # Return the full read shape (with resolved items) after creation.
        return OrderSerializer(instance).data

import uuid

from django.conf import settings
from django.db import models


class Address(models.Model):
    """
    Delivery/pickup addresses. Uganda-scoped: district instead of a full
    country/state hierarchy. Lat/lng power rider routing.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses"
    )
    label = models.CharField(max_length=100)  # e.g. "Lab", "Main office"
    district = models.CharField(max_length=100)
    street = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
        ]
        verbose_name_plural = "addresses"

    def __str__(self):
        return f"{self.label} — {self.district}"


class Rider(models.Model):
    """Delivery rider. One-to-one extension of a user with role = 'rider'."""

    class Availability(models.TextChoices):
        AVAILABLE = "available", "Available"
        ON_DELIVERY = "on_delivery", "On delivery"
        OFFLINE = "offline", "Offline"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rider_profile"
    )
    vehicle_type = models.CharField(max_length=50)  # e.g. "motorcycle", "van"
    license_plate = models.CharField(max_length=20, blank=True)
    availability_status = models.CharField(
        max_length=20, choices=Availability.choices, default=Availability.OFFLINE
    )
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["availability_status"]),
        ]

    def __str__(self):
        return f"Rider: {self.user}"


class Delivery(models.Model):
    """One-to-one with an order once dispatched."""

    class Status(models.TextChoices):
        ASSIGNED = "assigned", "Assigned"
        PICKED_UP = "picked_up", "Picked up"
        IN_TRANSIT = "in_transit", "In transit"
        DELIVERED = "delivered", "Delivered"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(
        "orders.Order", on_delete=models.CASCADE, related_name="delivery"
    )
    rider = models.ForeignKey(
        Rider, on_delete=models.SET_NULL, null=True, blank=True, related_name="deliveries"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ASSIGNED)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["rider"]),
        ]
        verbose_name_plural = "deliveries"

    def __str__(self):
        return f"Delivery for order {self.order_id}"

import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Channel(models.TextChoices):
        IN_APP = "in_app", "In App"
        EMAIL = "email", "Email"

    class Event(models.TextChoices):
        ACCOUNT_VERIFIED = "account_verified", "Account Verified"
        SUPPLIER_APPROVED = "supplier_approved", "Supplier Approved"
        ORDER_CREATED = "order_created", "Order Created"
        ORDER_CONFIRMED = "order_confirmed", "Order Confirmed"
        BATCH_ALLOCATED = "batch_allocated", "Batch Allocated"
        ORDER_SHIPPED = "order_shipped", "Order Shipped"
        ORDER_DELIVERED = "order_delivered", "Order Delivered"
        RFQ_RECEIVED = "rfq_received", "RFQ Received"
        QUOTE_RECEIVED = "quote_received", "Quote Received"
        DOCUMENT_VERIFIED = "document_verified", "Document Verified"
        DOCUMENT_EXPIRING = "document_expiring", "Document Expiring"
        LOW_STOCK = "low_stock", "Low Stock"
        PRICE_CHANGED = "price_changed", "Price Changed"
        DISPUTE_UPDATED = "dispute_updated", "Dispute Updated"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    event = models.CharField(max_length=30, choices=Event.choices)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    channel = models.CharField(
        max_length=10, choices=Channel.choices, default=Channel.IN_APP
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["recipient"]),
            models.Index(fields=["is_read"]),
        ]

    def __str__(self):
        return f"Notification: {self.title} → {self.recipient}"

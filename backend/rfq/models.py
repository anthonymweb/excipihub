import uuid

from django.conf import settings
from django.db import models


class RFQ(models.Model):
    """
    Request For Quotation created by a buyer. Suppliers respond with
    RFQQuote instances; the buyer then compares and (optionally) converts
    a quote into an order.
    """

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        QUOTED = "quoted", "Quoted"
        CLOSED = "closed", "Closed"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=50, unique=True, blank=True)
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rfqs"
    )
    ingredient_name = models.CharField(max_length=255)
    cas_number = models.CharField(max_length=50, blank=True)
    required_grade = models.CharField(max_length=50, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit = models.CharField(max_length=20, default="kg")
    required_delivery_date = models.DateField(null=True, blank=True)
    required_documents = models.JSONField(default=list, blank=True)
    additional_requirements = models.TextField(blank=True)
    verified_suppliers_only = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["buyer"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"RFQ {self.reference or self.id} — {self.ingredient_name}"


class RFQQuote(models.Model):
    """A supplier's response to an RFQ."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        EXPIRED = "expired", "Expired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rfq = models.ForeignKey(RFQ, on_delete=models.CASCADE, related_name="quotes")
    supplier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quotes"
    )
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2)
    lead_time_days = models.PositiveIntegerField(default=0)
    moq = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    validity_days = models.PositiveIntegerField(default=30)
    payment_terms = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("rfq", "supplier")]
        indexes = [
            models.Index(fields=["rfq"]),
            models.Index(fields=["supplier"]),
        ]

    def __str__(self):
        return f"Quote for RFQ {self.rfq.reference or self.rfq.id} by {self.supplier}"

    @property
    def total(self):
        return self.price_per_unit * self.rfq.quantity

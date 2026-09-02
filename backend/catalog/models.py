import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Excipient(models.Model):
    """
    A pharmaceutical ingredient listed by a manufacturer or distributor.
    Carries pharma-specific fields (CAS, function, grade, batch, expiry,
    certificate of analysis) that a generic product model wouldn't need.
    """

    class Category(models.TextChoices):
        BINDER = "Binder", "Binder"
        FILLER = "Filler", "Filler"
        LUBRICANT = "Lubricant", "Lubricant"
        PRESERVATIVE = "Preservative", "Preservative"
        COATING = "Coating", "Coating"
        SOLVENT = "Solvent", "Solvent"
        DISINTEGRANT = "Disintegrant", "Disintegrant"
        API = "API", "API"
        OTHER = "Other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="excipients"
    )
    name = models.CharField(max_length=255)
    cas_number = models.CharField(max_length=50, blank=True, help_text="Chemical Abstracts Service number")
    category = models.CharField(max_length=100, choices=Category.choices)
    function = models.CharField(max_length=100, blank=True, help_text="e.g. Diluent, Binder")
    grade = models.CharField(max_length=50, blank=True, help_text="e.g. USP, EP, BP, JP")
    country_of_origin = models.CharField(max_length=100, blank=True)
    certifications = models.JSONField(default=list, blank=True, help_text="e.g. ['GMP','ISO']")
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=20)  # e.g. "kg", "g", "L"
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    lead_time_days = models.PositiveIntegerField(default=0, help_text="Typical fulfilment lead time")
    batch_number = models.CharField(max_length=100, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    coa_url = models.URLField(blank=True)  # certificate of analysis document
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["seller"]),
            models.Index(fields=["category"]),
            models.Index(fields=["cas_number"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.unit_price}/{self.unit})"


class Batch(models.Model):
    """
    First-class traceability entity. A product (Excipient) can have many
    batches, each with its own manufacture/expiry dates, quantity, status
    and attached CoA/SDS documents.
    """

    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        RESERVED = "reserved", "Reserved"
        QC_HOLD = "qc_hold", "QC Hold"
        RELEASED = "released", "Released"
        QUARANTINED = "quarantined", "Quarantined"
        EXPIRED = "expired", "Expired"
        DEPLETED = "depleted", "Depleted"
        RECALLED = "recalled", "Recalled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    excipient = models.ForeignKey(
        Excipient, on_delete=models.CASCADE, related_name="batches"
    )
    batch_number = models.CharField(max_length=100)
    manufacture_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    quantity = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.AVAILABLE
    )
    coa_url = models.URLField(blank=True)
    sds_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["excipient"]),
            models.Index(fields=["status"]),
        ]
        verbose_name_plural = "batches"

    def __str__(self):
        return f"Batch {self.batch_number} ({self.status})"

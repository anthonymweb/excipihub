import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Excipient(models.Model):
    """
    A pharmaceutical ingredient listed by a manufacturer or distributor.
    Carries pharma-specific fields (batch, expiry, certificate of
    analysis) that a generic product model wouldn't need.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="excipients"
    )
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)  # e.g. "Binder", "Preservative"
    grade = models.CharField(max_length=50, blank=True, help_text="e.g. USP, EP, BP, JP")
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=20)  # e.g. "kg", "g", "L"
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    stock_quantity = models.PositiveIntegerField(default=0)
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
        ]

    def __str__(self):
        return f"{self.name} ({self.unit_price}/{self.unit})"

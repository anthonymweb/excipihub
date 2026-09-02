import uuid

from django.conf import settings
from django.db import models


class FormulationKit(models.Model):
    """
    A scientist's saved recipe of ingredients. The platform can then
    check ingredient availability across suppliers ("formulation kits").
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="formulation_kits"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Kit: {self.name}"


class FormulationItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kit = models.ForeignKey(
        FormulationKit, on_delete=models.CASCADE, related_name="items"
    )
    ingredient_name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.CharField(max_length=20, default="g")

    def __str__(self):
        return f"{self.ingredient_name} {self.quantity}{self.unit}"


class SavedProduct(models.Model):
    """Buyer-saved excipients for later reference / comparison."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_products"
    )
    excipient = models.ForeignKey(
        "catalog.Excipient", on_delete=models.CASCADE, related_name="saved_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "excipient")]

    def __str__(self):
        return f"Saved {self.excipient} by {self.user}"

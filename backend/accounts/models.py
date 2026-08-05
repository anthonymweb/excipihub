import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Single account table for every actor on the platform. Role-specific
    detail (institution, company info) lives on the model itself rather
    than in separate profile tables, since each role only needs a small,
    fixed set of extra fields.
    """

    class Role(models.TextChoices):
        SCIENTIST = "scientist", "Scientist"
        MANUFACTURER = "manufacturer", "Manufacturer"
        DISTRIBUTOR = "distributor", "Distributor"
        RIDER = "rider", "Rider"
        ADMIN = "admin", "Admin"

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)

    # Scientist-specific (blank for other roles)
    institution_name = models.CharField(max_length=255, blank=True)

    # Manufacturer / distributor-specific (blank for other roles)
    company_name = models.CharField(max_length=255, blank=True)
    business_license_no = models.CharField(max_length=100, blank=True)
    license_url = models.URLField(blank=True)
    gmp_cert_url = models.URLField(blank=True)
    iso_cert_url = models.URLField(blank=True)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )

    is_active_seller = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "phone"]

    class Meta:
        indexes = [
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

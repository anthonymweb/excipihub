import uuid

from django.conf import settings
from django.db import models


class Document(models.Model):
    """
    Central document service. A document can be attached to a supplier,
    a product (excipient) or a batch. Verification follows a small
    state machine. file_url points at uploaded media.
    """

    class DocType(models.TextChoices):
        COA = "coa", "Certificate of Analysis"
        SDS = "sds", "Safety Data Sheet"
        GMP_CERTIFICATE = "gmp", "GMP Certificate"
        ISO_CERTIFICATE = "iso", "ISO Certificate"
        BUSINESS_LICENSE = "business_license", "Business License"
        MANUFACTURING_LICENSE = "manufacturing_license", "Manufacturing License"
        TSE_BSE_DECLARATION = "tse_bse", "TSE/BSE Declaration"
        REGULATORY_LETTER = "regulatory_letter", "Regulatory Letter"
        ALLERGEN_DECLARATION = "allergen", "Allergen Declaration"
        HALAL_CERTIFICATE = "halal", "Halal Certificate"
        KOSHER_CERTIFICATE = "kosher", "Kosher Certificate"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        UNDER_REVIEW = "under_review", "Under Review"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"
        EXPIRED = "expired", "Expired"
        REPLACED = "replaced", "Replaced"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_type = models.CharField(max_length=30, choices=DocType.choices)
    file = models.FileField(upload_to="documents/%Y/%m/", blank=True, null=True)
    file_url = models.URLField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.UPLOADED
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents"
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_documents",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    version = models.PositiveIntegerField(default=1)

    # Relations — exactly one of these should be set.
    supplier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="supplier_documents",
    )
    product = models.ForeignKey(
        "catalog.Excipient",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="documents",
    )
    batch = models.ForeignKey(
        "catalog.Batch",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="documents",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["document_type"]),
        ]
        verbose_name_plural = "documents"

    def __str__(self):
        return f"{self.get_document_type_display()} ({self.status})"


class SupplierVerification(models.Model):
    """
    Tracks the supplier onboarding workflow per the design doc. Stored
    separately from the User so we keep a full audit trail of reviews.
    """

    class Stage(models.TextChoices):
        REGISTERED = "registered", "Registered"
        PROFILE_SUBMITTED = "profile_submitted", "Profile Submitted"
        DOCUMENTS_PENDING = "documents_pending", "Documents Pending"
        UNDER_REVIEW = "under_review", "Under Review"
        ADDITIONAL_INFO_REQUIRED = "additional_info", "Additional Info Required"
        APPROVED = "approved", "Approved"
        ACTIVE = "active", "Active"
        REJECTED = "rejected", "Rejected"
        RESUBMISSION = "resubmission", "Resubmission"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="verification"
    )
    stage = models.CharField(
        max_length=30, choices=Stage.choices, default=Stage.REGISTERED
    )
    risk_flags = models.JSONField(default=list, blank=True)
    reviewer_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supplier_reviews",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Verification for {self.supplier} — {self.stage}"

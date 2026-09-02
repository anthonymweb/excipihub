from rest_framework import serializers

from .models import Document, SupplierVerification


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.username", read_only=True)
    supplier_name = serializers.CharField(source="supplier.company_name", read_only=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "document_type",
            "file",
            "file_url",
            "status",
            "uploaded_by",
            "uploaded_by_name",
            "supplier_name",
            "verified_by",
            "verified_at",
            "expiry_date",
            "version",
            "supplier",
            "product",
            "batch",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "uploaded_by",
            "uploaded_by_name",
            "supplier_name",
            "verified_by",
            "verified_at",
            "created_at",
        ]


class SupplierVerificationSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.company_name", read_only=True)
    supplier_email = serializers.CharField(source="supplier.email", read_only=True)

    class Meta:
        model = SupplierVerification
        fields = [
            "id",
            "supplier",
            "supplier_name",
            "supplier_email",
            "stage",
            "risk_flags",
            "reviewer_notes",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "supplier", "supplier_name", "supplier_email", "created_at", "updated_at"]

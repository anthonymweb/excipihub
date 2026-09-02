from rest_framework import serializers

from .models import Batch, Excipient


class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = [
            "id",
            "excipient",
            "batch_number",
            "manufacture_date",
            "expiry_date",
            "quantity",
            "status",
            "coa_url",
            "sds_url",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ExcipientSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.company_name", read_only=True)
    batches = BatchSerializer(many=True, read_only=True)

    class Meta:
        model = Excipient
        fields = [
            "id",
            "seller",
            "seller_name",
            "name",
            "cas_number",
            "category",
            "function",
            "grade",
            "country_of_origin",
            "certifications",
            "description",
            "unit",
            "unit_price",
            "stock_quantity",
            "lead_time_days",
            "batch_number",
            "expiry_date",
            "coa_url",
            "is_active",
            "batches",
        ]
        read_only_fields = ["id", "seller", "batches"]

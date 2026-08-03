from rest_framework import serializers

from .models import Excipient


class ExcipientSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.company_name", read_only=True)

    class Meta:
        model = Excipient
        fields = [
            "id",
            "seller",
            "seller_name",
            "name",
            "category",
            "description",
            "unit",
            "unit_price",
            "stock_quantity",
            "batch_number",
            "expiry_date",
            "coa_url",
            "is_active",
        ]
        read_only_fields = ["id", "seller"]

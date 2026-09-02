from rest_framework import serializers

from .models import RFQ, RFQQuote


class RFQSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.username", read_only=True)
    quote_count = serializers.IntegerField(source="quotes.count", read_only=True)

    class Meta:
        model = RFQ
        fields = [
            "id",
            "reference",
            "buyer",
            "buyer_name",
            "ingredient_name",
            "cas_number",
            "required_grade",
            "quantity",
            "unit",
            "required_delivery_date",
            "required_documents",
            "additional_requirements",
            "verified_suppliers_only",
            "status",
            "quote_count",
            "created_at",
        ]
        read_only_fields = ["id", "reference", "buyer", "buyer_name", "quote_count", "created_at"]


class RFQQuoteSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.company_name", read_only=True)
    total = serializers.DecimalField(source="total", max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = RFQQuote
        fields = [
            "id",
            "rfq",
            "supplier",
            "supplier_name",
            "price_per_unit",
            "lead_time_days",
            "moq",
            "validity_days",
            "payment_terms",
            "notes",
            "status",
            "total",
            "created_at",
        ]
        read_only_fields = ["id", "supplier", "supplier_name", "total", "created_at"]

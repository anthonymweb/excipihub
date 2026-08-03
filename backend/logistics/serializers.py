from rest_framework import serializers

from .models import Address


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "label", "district", "street", "latitude", "longitude", "is_default"]
        read_only_fields = ["id"]

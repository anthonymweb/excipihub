from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone",
            "role",
            "institution_name",
            "company_name",
            "business_license_no",
            "license_url",
            "gmp_cert_url",
            "iso_cert_url",
            "verification_status",
            "is_staff",
        ]
        read_only_fields = ["id", "verification_status", "is_staff"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "phone",
            "password",
            "role",
            "institution_name",
            "company_name",
            "business_license_no",
            "license_url",
            "gmp_cert_url",
            "iso_cert_url",
        ]

    def validate(self, attrs):
        role = attrs.get("role")
        is_seller = role in {"manufacturer", "distributor"}
        if is_seller:
            missing = [
                name
                for name in ["company_name", "business_license_no", "license_url", "gmp_cert_url", "iso_cert_url"]
                if not attrs.get(name)
            ]
            if missing:
                raise serializers.ValidationError(
                    {"detail": "Seller accounts must include company and compliance documents.", "missing": missing}
                )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

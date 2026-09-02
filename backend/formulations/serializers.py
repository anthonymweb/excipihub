from rest_framework import serializers

from .models import FormulationItem, FormulationKit, SavedProduct


class FormulationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormulationItem
        fields = ["id", "kit", "ingredient_name", "quantity", "unit"]
        read_only_fields = ["id"]


class FormulationKitSerializer(serializers.ModelSerializer):
    items = FormulationItemSerializer(many=True, required=False)
    owner_name = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = FormulationKit
        fields = ["id", "owner", "owner_name", "name", "description", "items", "created_at", "updated_at"]
        read_only_fields = ["id", "owner", "owner_name", "created_at", "updated_at"]

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        kit = FormulationKit.objects.create(owner=self.context["request"].user, **validated_data)
        for item in items:
            FormulationItem.objects.create(kit=kit, **item)
        return kit

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items is not None:
            instance.items.all().delete()
            for item in items:
                FormulationItem.objects.create(kit=instance, **item)
        return instance


class SavedProductSerializer(serializers.ModelSerializer):
    excipient_name = serializers.CharField(source="excipient.name", read_only=True)

    class Meta:
        model = SavedProduct
        fields = ["id", "user", "excipient", "excipient_name", "created_at"]
        read_only_fields = ["id", "user", "excipient_name", "created_at"]

from rest_framework import serializers

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    recipient_name = serializers.CharField(source="recipient.username", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "sender_name",
            "recipient",
            "recipient_name",
            "subject",
            "body",
            "is_read",
            "rfq",
            "order",
            "created_at",
        ]
        read_only_fields = ["id", "sender", "sender_name", "recipient_name", "is_read", "created_at"]


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["recipient", "subject", "body", "rfq", "order"]

    def create(self, validated_data):
        validated_data["sender"] = self.context["request"].user
        return super().create(validated_data)

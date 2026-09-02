from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "event",
            "title",
            "message",
            "link",
            "is_read",
            "channel",
            "created_at",
        ]
        read_only_fields = fields

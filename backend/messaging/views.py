from django.db.models import Q
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Message
from .serializers import MessageCreateSerializer, MessageSerializer


class MessageViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return MessageCreateSerializer
        return MessageSerializer

    def get_queryset(self):
        return Message.objects.select_related("sender", "recipient").filter(
            Q(sender=self.request.user) | Q(recipient=self.request.user)
        )

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        m = self.get_object()
        if m.recipient_id != request.user.id:
            return Response({"detail": "Not authorized."}, status=403)
        m.is_read = True
        m.save(update_fields=["is_read"])
        return Response({"detail": "ok"})

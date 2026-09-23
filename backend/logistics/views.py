from rest_framework import permissions, viewsets

from .models import Address
from .serializers import AddressSerializer


class AddressViewSet(viewsets.ModelViewSet):
    """A user only ever sees and manages their own addresses."""

    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        if instance.is_default:
            Address.objects.filter(user=self.request.user, is_default=True).exclude(pk=instance.pk).update(is_default=False)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.is_default:
            Address.objects.filter(user=self.request.user, is_default=True).exclude(pk=instance.pk).update(is_default=False)

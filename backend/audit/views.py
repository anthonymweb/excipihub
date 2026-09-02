from rest_framework import permissions, viewsets

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = AuditLog.objects.select_related("actor").all()
        action = self.request.query_params.get("action")
        if action:
            qs = qs.filter(action=action)
        return qs.order_by("-created_at")

import uuid

from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """
    Immutable record of sensitive actions across the platform. Written
    via the audit.log() helper rather than constructed directly.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_actions",
    )
    action = models.CharField(max_length=50)
    object_type = models.CharField(max_length=50, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["action"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.action} by {self.actor} @ {self.created_at}"


def log(action, actor=None, object_type="", object_id="", details=None, request=None):
    """Convenience helper to write an audit entry."""
    ip = None
    if request is not None:
        ip = request.META.get("REMOTE_ADDR")
    AuditLog.objects.create(
        actor=actor,
        action=action,
        object_type=object_type,
        object_id=str(object_id),
        details=details or {},
        ip_address=ip,
    )

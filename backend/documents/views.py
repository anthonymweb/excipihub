from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from audit.models import log as audit_log

from .models import Document, SupplierVerification
from .serializers import DocumentSerializer, SupplierVerificationSerializer


class DocumentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in permissions.SAFE_METHODS:
            return True
        # Uploader / supplier owner can manage their own documents.
        return obj.uploaded_by_id == request.user.id or obj.supplier_id == request.user.id


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [DocumentPermission]

    def get_queryset(self):
        qs = Document.objects.select_related("uploaded_by", "supplier", "product", "batch").all()
        params = self.request.query_params
        if params.get("supplier"):
            qs = qs.filter(supplier_id=params["supplier"])
        if params.get("product"):
            qs = qs.filter(product_id=params["product"])
        if params.get("batch"):
            qs = qs.filter(batch_id=params["batch"])
        if params.get("document_type"):
            qs = qs.filter(document_type=params["document_type"])
        if params.get("status"):
            qs = qs.filter(status=params["status"])
        if params.get("pending") == "true":
            qs = qs.filter(status__in=[Document.Status.UPLOADED, Document.Status.UNDER_REVIEW])
        return qs

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="verify")
    def verify(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Admin only."}, status=403)
        doc = self.get_object()
        doc.status = Document.Status.VERIFIED
        doc.verified_by = request.user
        doc.verified_at = timezone.now()
        doc.save(update_fields=["status", "verified_by", "verified_at"])
        audit_log("DOCUMENT_VERIFIED", request.user, "Document", doc.id, request=request)
        return Response(DocumentSerializer(doc).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Admin only."}, status=403)
        doc = self.get_object()
        doc.status = Document.Status.REJECTED
        doc.save(update_fields=["status"])
        return Response(DocumentSerializer(doc).data)


class SupplierVerificationViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierVerificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return SupplierVerification.objects.select_related("supplier").all()
        return SupplierVerification.objects.filter(supplier=self.request.user)

    def perform_create(self, serializer):
        serializer.save(supplier=self.request.user)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Admin only."}, status=403)
        v = self.get_object()
        v.stage = SupplierVerification.Stage.ACTIVE
        v.reviewed_by = request.user
        v.reviewed_at = timezone.now()
        v.risk_flags = request.data.get("risk_flags", v.risk_flags)
        v.reviewer_notes = request.data.get("reviewer_notes", v.reviewer_notes)
        v.save()
        v.supplier.verification_status = "verified"
        v.supplier.is_active_seller = True
        v.supplier.save(update_fields=["verification_status", "is_active_seller"])
        audit_log("SUPPLIER_APPROVED", request.user, "Supplier", v.supplier.id, request=request)
        return Response(SupplierVerificationSerializer(v).data)

    @action(detail=True, methods=["post"], url_path="request-info")
    def request_info(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Admin only."}, status=403)
        v = self.get_object()
        v.stage = SupplierVerification.Stage.ADDITIONAL_INFO_REQUIRED
        v.reviewer_notes = request.data.get("reviewer_notes", v.reviewer_notes)
        v.reviewed_by = request.user
        v.reviewed_at = timezone.now()
        v.save()
        return Response(SupplierVerificationSerializer(v).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Admin only."}, status=403)
        v = self.get_object()
        v.stage = SupplierVerification.Stage.REJECTED
        v.reviewer_notes = request.data.get("reviewer_notes", v.reviewer_notes)
        v.reviewed_by = request.user
        v.reviewed_at = timezone.now()
        v.save()
        v.supplier.verification_status = "rejected"
        v.supplier.save(update_fields=["verification_status"])
        audit_log("SUPPLIER_REJECTED", request.user, "Supplier", v.supplier.id, request=request)
        return Response(SupplierVerificationSerializer(v).data)

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from catalog.models import Batch, Excipient
from documents.models import Document
from orders.models import Dispute, Review
from orders.serializers import DisputeSerializer, ReviewSerializer

from .models import User
from .serializers import UserSerializer


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff


class AdminSellerViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    def list(self, request):
        users = User.objects.filter(
            role__in=["manufacturer", "distributor"],
            verification_status="pending",
        )
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="verify")
    def verify(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        action_type = request.data.get("action")
        if action_type not in ("approve", "reject"):
            return Response(
                {"detail": "Action must be 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.verification_status = "verified" if action_type == "approve" else "rejected"
        user.save(update_fields=["verification_status"])
        return Response(UserSerializer(user).data)


class AdminDisputeViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    def list(self, request):
        disputes = Dispute.objects.select_related("order", "raised_by").all()
        serializer = DisputeSerializer(disputes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="resolve")
    def resolve(self, request, pk=None):
        try:
            dispute = Dispute.objects.get(pk=pk)
        except Dispute.DoesNotExist:
            return Response({"detail": "Dispute not found."}, status=status.HTTP_404_NOT_FOUND)

        outcome = request.data.get("outcome")
        resolution = request.data.get("resolution", "")
        if outcome not in ("buyer", "seller"):
            return Response(
                {"detail": "Outcome must be 'buyer' or 'seller'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dispute.status = Dispute.Status.RESOLVED
        dispute.outcome = outcome
        dispute.resolution = resolution
        dispute.save(update_fields=["status", "outcome", "resolution"])
        return Response(DisputeSerializer(dispute).data)


class AdminUserViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    def list(self, request):
        users = User.objects.all()
        role = request.query_params.get("role")
        if role:
            users = users.filter(role=role)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


def _score(checks):
    return round(sum(checks.values()) / len(checks) * 100)


class AdminComplianceViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    def list(self, request):
        suppliers = User.objects.filter(role__in=["manufacturer", "distributor"])
        supplier_scores = []
        for s in suppliers:
            docs = Document.objects.filter(supplier=s)
            checks = {
                "business_verification": s.verification_status == "verified",
                "gmp_verification": docs.filter(document_type="gmp", status="verified").exists(),
                "iso_verification": docs.filter(document_type="iso", status="verified").exists(),
                "document_validity": docs.filter(status="verified").exists() if docs.exists() else False,
                "product_documentation": s.excipients.exists(),
                "batch_traceability": Batch.objects.filter(excipient__seller=s).exists(),
                "profile_completeness": bool(s.company_name and s.business_license_no),
            }
            supplier_scores.append(
                {
                    "id": str(s.id),
                    "name": s.company_name or s.username,
                    "status": s.verification_status,
                    "score": _score(checks),
                    "checks": checks,
                }
            )

        products = Excipient.objects.select_related("seller").all()
        product_scores = []
        for p in products:
            checks = {
                "identity_verified": bool(p.name),
                "cas_number": bool(p.cas_number),
                "grade_declared": bool(p.grade),
                "supplier_verified": p.seller.verification_status == "verified",
                "sds_available": Document.objects.filter(product=p, document_type="sds").exists(),
                "batch_coa": Batch.objects.filter(excipient=p, coa_url__gt="").exists(),
                "origin_declared": bool(p.country_of_origin),
            }
            product_scores.append(
                {
                    "id": str(p.id),
                    "name": p.name,
                    "supplier": p.seller.company_name or p.seller.username if p.seller else "—",
                    "score": _score(checks),
                    "checks": checks,
                }
            )

        return Response({"suppliers": supplier_scores, "products": product_scores})


class AdminReviewViewSet(viewsets.ModelViewSet):
    """Admin moderation of buyer reviews."""

    serializer_class = ReviewSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["get", "delete"]

    def get_queryset(self):
        return Review.objects.select_related("order", "reviewer").all()

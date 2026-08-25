from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from orders.models import Dispute
from orders.serializers import DisputeSerializer

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

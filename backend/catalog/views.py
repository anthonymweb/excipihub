from rest_framework import permissions, viewsets

from .models import Excipient
from .serializers import ExcipientSerializer


class IsSellerOrReadOnly(permissions.BasePermission):
    """Anyone can browse the catalog. Only the seller who listed an
    excipient can edit or delete it."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller_id == request.user.id


class ExcipientViewSet(viewsets.ModelViewSet):
    """
    list / retrieve: open to everyone (scientists browsing the catalog).
    create: any authenticated manufacturer/distributor.
    update / destroy: only the seller who owns the listing.
    """

    queryset = Excipient.objects.filter(is_active=True).select_related("seller")
    serializer_class = ExcipientSerializer
    permission_classes = [IsSellerOrReadOnly]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__iexact=category)
        return qs

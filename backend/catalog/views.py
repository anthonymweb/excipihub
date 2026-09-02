from django.db import models
from rest_framework import permissions, viewsets

from .models import Batch, Excipient
from .serializers import BatchSerializer, ExcipientSerializer


class IsVerifiedSellerOrReadOnly(permissions.BasePermission):
    """Anyone can browse the catalog. Only verified sellers can create
    excipients, and only the seller who owns a listing can edit or delete it."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == "POST":
            user = request.user
            return (
                user.is_authenticated
                and user.role in {"manufacturer", "distributor"}
                and user.is_active_seller
            )
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller_id == request.user.id


class IsBatchOwnerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated
            and request.user.role in {"manufacturer", "distributor"}
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.excipient.seller_id == request.user.id


class ExcipientViewSet(viewsets.ModelViewSet):
    """
    list / retrieve: open to everyone (scientists browsing the catalog).
    create: any authenticated manufacturer/distributor.
    update / destroy: only the seller who owns the listing.
    """

    queryset = (
        Excipient.objects.filter(is_active=True)
        .select_related("seller")
        .prefetch_related("batches")
        .order_by("name")
    )
    serializer_class = ExcipientSerializer
    permission_classes = [IsVerifiedSellerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__iexact=category)

        grade = self.request.query_params.get("grade")
        if grade:
            qs = qs.filter(grade__iexact=grade)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                models.Q(name__icontains=search)
                | models.Q(cas_number__icontains=search)
                | models.Q(category__icontains=search)
                | models.Q(function__icontains=search)
                | models.Q(country_of_origin__icontains=search)
                | models.Q(description__icontains=search)
            )

        if self.request.query_params.get("my") == "true" and self.request.user.is_authenticated:
            qs = qs.filter(seller=self.request.user)
        return qs


class BatchViewSet(viewsets.ModelViewSet):
    serializer_class = BatchSerializer
    permission_classes = [IsBatchOwnerOrReadOnly]

    def get_queryset(self):
        qs = Batch.objects.select_related("excipient").all()
        excipient = self.request.query_params.get("excipient")
        if excipient:
            qs = qs.filter(excipient_id=excipient)
        if (
            self.request.query_params.get("my") == "true"
            and self.request.user.is_authenticated
        ):
            qs = qs.filter(excipient__seller=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save()

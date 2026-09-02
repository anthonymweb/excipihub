from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import RFQ, RFQQuote
from .serializers import RFQQuoteSerializer, RFQSerializer


class RFQPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return obj.buyer_id == request.user.id or request.user.is_staff


class RFQViewSet(viewsets.ModelViewSet):
    serializer_class = RFQSerializer
    permission_classes = [RFQPermission]

    def get_queryset(self):
        user = self.request.user
        qs = RFQ.objects.select_related("buyer").prefetch_related("quotes").all()
        if user.is_staff:
            return qs
        if user.role in {"manufacturer", "distributor"}:
            # Suppliers see open RFQs they can quote on.
            return qs.filter(status=RFQ.Status.OPEN)
        return qs.filter(buyer=user)

    def perform_create(self, serializer):
        rfq = serializer.save(buyer=self.request.user)
        rfq.reference = f"RFQ-{timezone.now().strftime('%Y%m')}-{rfq.id.hex[:6].upper()}"
        rfq.save(update_fields=["reference"])

    @action(detail=True, methods=["get", "post"], url_path="quotes")
    def quotes(self, request, pk=None):
        rfq = self.get_object()
        if request.method == "GET":
            qs = rfq.quotes.select_related("supplier").all()
            return Response(RFQQuoteSerializer(qs, many=True).data)
        # POST -> supplier submits a quote.
        if request.user.role not in {"manufacturer", "distributor"}:
            return Response({"detail": "Only suppliers can quote."}, status=403)
        serializer = RFQQuoteSerializer(
            data={"rfq": rfq.id, **request.data}, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(supplier=request.user)
        rfq.status = RFQ.Status.QUOTED
        rfq.save(update_fields=["status"])
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["post"], url_path="close")
    def close(self, request, pk=None):
        rfq = self.get_object()
        if rfq.buyer_id != request.user.id and not request.user.is_staff:
            return Response({"detail": "Not authorized."}, status=403)
        rfq.status = RFQ.Status.CLOSED
        rfq.save(update_fields=["status"])
        return Response(RFQSerializer(rfq).data)


class RFQQuotePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in permissions.SAFE_METHODS:
            return obj.supplier_id == request.user.id or obj.rfq.buyer_id == request.user.id
        return obj.supplier_id == request.user.id


class RFQQuoteViewSet(viewsets.ModelViewSet):
    serializer_class = RFQQuoteSerializer
    permission_classes = [RFQQuotePermission]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = RFQQuote.objects.select_related("supplier", "rfq").all()
        rfq_id = self.request.query_params.get("rfq")
        if rfq_id:
            qs = qs.filter(rfq_id=rfq_id)
        if self.request.user.is_staff:
            return qs
        return qs.filter(
            Q(supplier=self.request.user)
            | Q(rfq__buyer=self.request.user)
        )

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        quote = self.get_object()
        if quote.rfq.buyer_id != request.user.id and not request.user.is_staff:
            return Response({"detail": "Only the RFQ owner can accept."}, status=403)
        RFQQuote.objects.filter(rfq=quote.rfq).exclude(id=quote.id).update(status=RFQQuote.Status.REJECTED)
        quote.status = RFQQuote.Status.ACCEPTED
        quote.save(update_fields=["status"])
        quote.rfq.status = RFQ.Status.CLOSED
        quote.rfq.save(update_fields=["status"])
        return Response(RFQQuoteSerializer(quote).data)

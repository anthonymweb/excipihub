from rest_framework import permissions, viewsets

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """
    A buyer only ever sees their own orders. Creating an order builds
    its line items in the same request (see OrderCreateSerializer).
    Orders aren't editable or deletable via the API once placed —
    status changes happen through admin/staff tooling instead.
    """

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).prefetch_related("items")

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

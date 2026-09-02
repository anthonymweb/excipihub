from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from catalog.models import Excipient

from .models import FormulationKit, SavedProduct
from .serializers import (
    FormulationKitSerializer,
    SavedProductSerializer,
)


class FormulationKitViewSet(viewsets.ModelViewSet):
    serializer_class = FormulationKitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FormulationKit.objects.filter(owner=self.request.user).prefetch_related("items")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["get"], url_path="availability")
    def availability(self, request, pk=None):
        """Cross-check each formulation ingredient against the catalog."""
        kit = self.get_object()
        results = []
        for item in kit.items.all():
            matches = Excipient.objects.filter(
                name__icontains=item.ingredient_name
            ).select_related("seller")
            results.append(
                {
                    "ingredient": item.ingredient_name,
                    "required_quantity": f"{item.quantity}{item.unit}",
                    "available": matches.exists(),
                    "suppliers": [
                        {
                            "id": e.id,
                            "name": e.name,
                            "seller": e.seller_name,
                            "price": str(e.unit_price),
                            "unit": e.unit,
                            "stock": e.stock_quantity,
                        }
                        for e in matches[:5]
                    ],
                }
            )
        available = sum(1 for r in results if r["available"])
        return Response(
            {
                "kit": kit.name,
                "available_count": available,
                "total_count": len(results),
                "items": results,
            }
        )


class SavedProductViewSet(viewsets.ModelViewSet):
    serializer_class = SavedProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return SavedProduct.objects.filter(user=self.request.user).select_related("excipient", "excipient__seller")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"], url_path="toggle")
    def toggle(self, request):
        excipient_id = request.data.get("excipient")
        if not excipient_id:
            return Response({"detail": "excipient required"}, status=400)
        obj, created = SavedProduct.objects.get_or_create(
            user=request.user, excipient_id=excipient_id
        )
        if not created:
            obj.delete()
            return Response({"saved": False})
        return Response({"saved": True}, status=201)

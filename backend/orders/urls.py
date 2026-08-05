from rest_framework.routers import DefaultRouter

from .views import DisputeViewSet, OrderViewSet, SellerOrderItemViewSet

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")
router.register("seller-order-items", SellerOrderItemViewSet, basename="seller-order-item")
router.register("disputes", DisputeViewSet, basename="dispute")

urlpatterns = router.urls

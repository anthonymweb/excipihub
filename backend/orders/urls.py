from rest_framework.routers import DefaultRouter

from .views import (
    DisputeViewSet,
    OrderViewSet,
    ReviewViewSet,
    SellerOrderItemViewSet,
    SellerOrderViewSet,
)

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")
router.register("seller-order-items", SellerOrderItemViewSet, basename="seller-order-item")
router.register("seller-orders", SellerOrderViewSet, basename="seller-order")
router.register("disputes", DisputeViewSet, basename="dispute")
router.register("reviews", ReviewViewSet, basename="review")

urlpatterns = router.urls

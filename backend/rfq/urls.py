from rest_framework.routers import DefaultRouter

from .views import RFQQuoteViewSet, RFQViewSet

router = DefaultRouter()
router.register("rfqs", RFQViewSet, basename="rfq")
router.register("rfq-quotes", RFQQuoteViewSet, basename="rfqquote")

urlpatterns = router.urls

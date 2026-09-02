from rest_framework.routers import DefaultRouter

from .views import BatchViewSet, ExcipientViewSet

router = DefaultRouter()
router.register("excipients", ExcipientViewSet, basename="excipient")
router.register("batches", BatchViewSet, basename="batch")

urlpatterns = router.urls

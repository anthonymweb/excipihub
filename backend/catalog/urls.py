from rest_framework.routers import DefaultRouter

from .views import ExcipientViewSet

router = DefaultRouter()
router.register("excipients", ExcipientViewSet, basename="excipient")

urlpatterns = router.urls

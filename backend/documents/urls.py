from rest_framework.routers import DefaultRouter

from .views import DocumentViewSet, SupplierVerificationViewSet

router = DefaultRouter()
router.register("documents", DocumentViewSet, basename="document")
router.register("supplier-verifications", SupplierVerificationViewSet, basename="supplierverification")

urlpatterns = router.urls

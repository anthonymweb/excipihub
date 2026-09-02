from rest_framework.routers import DefaultRouter

from .views import FormulationKitViewSet, SavedProductViewSet

router = DefaultRouter()
router.register("formulation-kits", FormulationKitViewSet, basename="formulationkit")
router.register("saved-products", SavedProductViewSet, basename="savedproduct")

urlpatterns = router.urls

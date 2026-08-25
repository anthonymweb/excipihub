from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .admin_views import AdminDisputeViewSet, AdminSellerViewSet, AdminUserViewSet

router = DefaultRouter()
router.register(r"sellers", AdminSellerViewSet, basename="admin-sellers")
router.register(r"disputes", AdminDisputeViewSet, basename="admin-disputes")
router.register(r"users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("", include(router.urls)),
]

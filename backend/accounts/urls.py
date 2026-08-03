from django.urls import path

from .views import LoginView, MeView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),  # POST email + password -> {"token": "..."}
    path("me/", MeView.as_view(), name="me"),
]

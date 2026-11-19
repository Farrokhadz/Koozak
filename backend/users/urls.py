# users/urls.py
from django.urls import path
from users.views import LogoutView, MeView, RequestOTPView, VerifyOTPView

urlpatterns = [
    path("auth/otp/request/", RequestOTPView.as_view(), name="otp-request"),
    path("auth/otp/verify/", VerifyOTPView.as_view(), name="otp-verify"),
    path("auth/me/", MeView.as_view(), name="user-me"),
    path("auth/logout/", LogoutView.as_view(), name="user-logout"),
]
# config/urls.py
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("finance.urls")),
    path("api/users/", include("users.urls")),  # اضافه شدن مسیرهای کاربران
    path("api-auth/", include("rest_framework.urls")),
]
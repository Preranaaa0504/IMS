from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),  # Django admin site

    # JWT authentication endpoints:
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),      # Obtain JWT access and refresh tokens
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),      # Refresh JWT access token using refresh token

    path("", include("inventory.urls")),  # Include all URLs from the inventory app
]

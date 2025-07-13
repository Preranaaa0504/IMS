from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InventoryViewSet, SupplierViewSet, OrderViewSet,
    export_inventory_csv, low_stock_items,
    register_user, get_current_user_info,
    order_history, update_order_status
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')   # CRUD endpoints for inventory items
router.register(r'suppliers', SupplierViewSet, basename='suppliers')   # CRUD endpoints for suppliers
router.register(r'orders', OrderViewSet, basename='orders')            # CRUD endpoints for orders

# Define the URL patterns for the API.
urlpatterns = [
    path('', include(router.urls)),  # Include all router-generated endpoints

    # Custom endpoints not covered by the router:
    path('inventory-report/', export_inventory_csv, name='inventory_csv'),  # Export inventory as CSV
    path('low-stock/', low_stock_items, name='low_stock'),                 # Get low-stock inventory items
    path('register/', register_user, name='register_user'),                # User registration endpoint
    path('me/', get_current_user_info, name='current_user'),               # Get current logged-in user's info
    path('orders/history/', order_history, name='order_history'),          # Get order history for user
    path('orders/<int:pk>/update-status/', update_order_status, name='update_order_status'),  # Admin: update order status
]

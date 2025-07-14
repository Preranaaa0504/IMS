from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InventoryViewSet, SupplierViewSet, OrderViewSet,
    export_inventory_csv, low_stock_items,
    register_user, get_current_user_info,
    order_history, update_order_status
)

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'suppliers', SupplierViewSet, basename='suppliers')
router.register(r'orders', OrderViewSet, basename='orders')

urlpatterns = [
    path('', include(router.urls)),
    path('inventory-report/', export_inventory_csv, name='inventory_csv'),
    path('low-stock/', low_stock_items, name='low_stock'),
    path('register/', register_user, name='register_user'),
    path('me/', get_current_user_info, name='current_user'),
    path('orders/history/', order_history, name='order_history'),
    path('orders/<int:pk>/update-status/', update_order_status, name='update_order_status'),
]
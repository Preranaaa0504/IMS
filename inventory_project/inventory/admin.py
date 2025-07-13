from django.contrib import admin
from .models import InventoryItem, Supplier, UserProfile

# Customize InventoryItem admin display
@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'quantity', 'price', 'supplier', 'user', 'expiration_date')
    search_fields = ('name', 'sku')
    list_filter = ('supplier', 'expiration_date')
    ordering = ('name',)


# Customize Supplier admin display
@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'gst_number', 'email', 'phone', 'created_by')
    search_fields = ('name', 'gst_number')
    list_filter = ('created_by',)
    ordering = ('name',)


# Customize UserProfile admin display
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'mobile', 'age', 'gender', 'address')
    search_fields = ('user__username', 'mobile')
    list_filter = ('gender',)
    ordering = ('user__username',)

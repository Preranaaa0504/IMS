from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

# UserProfile extends the built-in User model with additional fields.
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')  # Links profile to a single User.
    mobile = models.CharField(max_length=15)  # Stores the user's mobile number.
    age = models.PositiveIntegerField()  # Stores the user's age; must be non-negative.
    gender = models.CharField(max_length=10)  # Stores gender as a string.
    address = models.TextField()  # Stores the user's address.

    def __str__(self):
        return self.user.username  # Returns the username for easy identification in admin.
        

# Supplier represents a supplier entity in the system.
class Supplier(models.Model):
    name = models.CharField(max_length=255)  # Name of the supplier.
    gst_number = models.CharField(max_length=15, unique=True, null=True, blank=True)  # GST number, optional and unique.
    email = models.EmailField(blank=True, null=True)  # Supplier's email, optional.
    phone = models.CharField(max_length=10, null=True, blank=True)  # Phone number, optional.
    address = models.TextField(null=True, blank=True)  # Address, optional.
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_suppliers')  # User who created the supplier.
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when created.
    updated_at = models.DateTimeField(auto_now=True)  # Timestamp when updated.

    def __str__(self):
        return f"{self.name} ({self.gst_number or 'No GST'})"  # Shows name and GST for clarity.

    class Meta:
        ordering = ['-created_at']  # Newest suppliers appear first.


# InventoryItem represents an item in the user's inventory.
class InventoryItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory_items')  # Owner of the item.
    name = models.CharField(max_length=100)  # Item name.
    sku = models.CharField(max_length=50)  # SKU code (unique per user, not globally).
    quantity = models.PositiveIntegerField()  # Quantity in stock.
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price with high precision.
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_items')  # Optional supplier.
    expiration_date = models.DateField(null=True, blank=True)  # Optional expiration date.
    threshold = models.PositiveIntegerField()  # Minimum quantity before restock alert.
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when created.
    updated_at = models.DateTimeField(auto_now=True)  # Timestamp when updated.

    def __str__(self):
        return f"{self.name} (SKU: {self.sku})"  # Shows name and SKU for clarity.

    def clean(self):
        """
        Custom validation to ensure SKU is unique per user.
        """
        if self.sku:
            # Check for existing items with the same SKU for this user
            existing_items = InventoryItem.objects.filter(
                user=self.user, 
                sku=self.sku
            )
            # If this is an update, exclude the current instance
            if self.pk:
                existing_items = existing_items.exclude(pk=self.pk)
            if existing_items.exists():
                raise ValidationError({
                    'sku': f'An item with SKU "{self.sku}" already exists in your inventory.'
                })

    def save(self, *args, **kwargs):
        """
        Override save to call clean validation.
        """
        self.clean()
        super().save(*args, **kwargs)

    class Meta:
        # This ensures SKU is unique only within the same user's inventory
        unique_together = ['user', 'sku']
        indexes = [
            models.Index(fields=["sku"]),
            models.Index(fields=["user", "sku"]),  # Added composite index for better performance
        ]
        ordering = ['-created_at']  # Newest items appear first.


# Order represents a user's order containing multiple inventory items.
class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')  # User who placed the order.
    items = models.ManyToManyField(InventoryItem, through='OrderItem')  # Items in the order, via OrderItem.
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)  # Total order value.
    delivery_address = models.TextField()  # Delivery address for the order.
    billing_name = models.CharField(max_length=255, blank=True)  # Optional billing name.
    billing_address = models.TextField()  # Billing address.
    tax_id = models.CharField(max_length=50, blank=True)  # Optional tax ID.
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')  # Order status.
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when created.
    updated_at = models.DateTimeField(auto_now=True)  # Timestamp when updated.

    def __str__(self):
        return f"Order #{self.id} by {self.user.username}"  # Shows order ID and user.

    class Meta:
        ordering = ['-created_at']  # Newest orders appear first.


# OrderItem represents the association between an order and an inventory item.
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')  # The order.
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)  # The inventory item.
    quantity = models.PositiveIntegerField()  # Quantity of the item in this order.
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2)  # Price at the time of order.

    def __str__(self):
        return f"{self.quantity} x {self.item.name} (Order #{self.order.id})"  # Shows quantity, item, and order.

    def save(self, *args, **kwargs):
        # Set price_at_order to current item price if not provided
        if not self.price_at_order:
            self.price_at_order = self.item.price
        super().save(*args, **kwargs)

    class Meta:
        # Ensure an item can only be added once per order
        unique_together = ['order', 'item']

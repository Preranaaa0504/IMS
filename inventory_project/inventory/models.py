from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    mobile = models.CharField(max_length=15)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=10)
    address = models.TextField()

    def __str__(self):
        return self.user.username


class Supplier(models.Model):
    name = models.CharField(max_length=255)
    gst_number = models.CharField(max_length=15, unique=True, null=True, blank=True)  # made nullable and blank
    email = models.EmailField(blank=True, null=True)  # made nullable
    phone = models.CharField(max_length=10, null=True, blank=True)  # made nullable and blank
    address = models.TextField(null=True, blank=True)  # made nullable and blank
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_suppliers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.gst_number or 'No GST'})"

    class Meta:
        ordering = ['-created_at']


class InventoryItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory_items')
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50)  # Removed unique=True
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Changed from FloatField for better precision
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_items')
    expiration_date = models.DateField(null=True, blank=True)
    threshold = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (SKU: {self.sku})"

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
        ordering = ['-created_at']


class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    items = models.ManyToManyField(InventoryItem, through='OrderItem')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = models.TextField()
    billing_name = models.CharField(max_length=255, blank=True)
    billing_address = models.TextField()
    tax_id = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} by {self.user.username}"

    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.item.name} (Order #{self.order.id})"

    def save(self, *args, **kwargs):
        # Set price_at_order to current item price if not provided
        if not self.price_at_order:
            self.price_at_order = self.item.price
        super().save(*args, **kwargs)

    class Meta:
        # Ensure an item can only be added once per order
        unique_together = ['order', 'item']
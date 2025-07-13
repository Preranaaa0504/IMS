from rest_framework import serializers
from django.contrib.auth.models import User
from .models import InventoryItem, UserProfile, Supplier, Order, OrderItem
import re
from rest_framework.exceptions import ValidationError

# Regular expression for validating GST numbers in India.
GST_REGEX = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'

# Serializer for the Supplier model.
class SupplierSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')  # Read-only field to show creator's username.
    gst_number = serializers.CharField(required=False, allow_blank=True)  # GST is optional and can be blank.

    class Meta:
        model = Supplier
        fields = '__all__'  # Includes all model fields.
        read_only_fields = ['id', 'created_by']  # These fields cannot be modified via API.
        extra_kwargs = {
            'name': {'required': True},  # Name is required.
            'address': {'required': True},  # Address is required.
            'email': {'required': False},  # Email is optional.
            'phone': {'required': False},  # Phone is optional.
        }

    def validate_gst_number(self, value):
        # Validates GST number format if provided.
        if value and not re.match(GST_REGEX, value):
            raise ValidationError(
                'Invalid GST format. Expected format: 22AAAAA0000A1Z5'
            )
        return value

# Serializer for the InventoryItem model.
class InventorySerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)  # Displays username of the item owner.
    supplier = SupplierSerializer(read_only=True)  # Nested serializer for supplier details (read-only).
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)  # Supplier name (read-only).
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(),
        source='supplier',
        write_only=True,
        required=False,
        allow_null=True
    )  # Allows setting supplier by ID when creating/updating; not required.

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'user', 'name', 'sku', 'quantity', 'price',
            'supplier', 'supplier_name', 'supplier_id',
            'expiration_date', 'threshold', 'created_at', 'updated_at'
        ]

    def validate_sku(self, value):
        """
        Ensures SKU is unique for the current user.
        Different users can have the same SKU.
        """
        if not value:
            raise ValidationError("SKU is required.")
        
        # Gets the current user from the request context.
        user = self.context['request'].user
        
        # Checks if this is an update operation.
        if self.instance:
            # Excludes the current instance from uniqueness check.
            existing_items = InventoryItem.objects.filter(
                user=user, 
                sku=value
            ).exclude(id=self.instance.id)
        else:
            # For new items, checks if SKU already exists for this user.
            existing_items = InventoryItem.objects.filter(
                user=user, 
                sku=value
            )
        
        if existing_items.exists():
            raise ValidationError(
                f"An item with SKU '{value}' already exists in your inventory."
            )
        
        return value

    def validate(self, attrs):
        """
        Object-level validation hook.
        Extend this method for additional validation logic if needed.
        """
        return attrs

    def create(self, validated_data):
        """
        Assigns the current user as the owner before creating the inventory item.
        """
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

# Serializer for the OrderItem model (intermediate model for Order and InventoryItem).
class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)  # Name of the inventory item.
    item_sku = serializers.CharField(source='item.sku', read_only=True)    # SKU of the inventory item.

    class Meta:
        model = OrderItem
        fields = ['id', 'item', 'item_name', 'item_sku', 'quantity', 'price_at_order']
        read_only_fields = ['price_at_order']  # Price at order time is read-only.

# Serializer for the Order model.
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source='order_items', many=True, read_only=True)  # Nested order items.
    user = serializers.CharField(source='user.username', read_only=True)  # Username of the order's owner.

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'items', 'total_amount', 
            'delivery_address', 'billing_name', 'billing_address', 'tax_id',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'status']  # These fields can't be set via API.

    def create(self, validated_data):
        # Retrieves item data from context (should be provided when creating an order).
        items_data = self.context.get('items', [])
        # Creates the order instance.
        order = Order.objects.create(
            user=validated_data['user'],
            total_amount=validated_data['total_amount'],
            delivery_address=validated_data['delivery_address'],
            billing_name=validated_data.get('billing_name', ''),
            billing_address=validated_data['billing_address'],
            tax_id=validated_data.get('tax_id', '')
        )
        
        # Creates associated OrderItem instances for each item.
        for item_data in items_data:
            item = item_data['item']
            quantity = item_data['quantity']
            OrderItem.objects.create(
                order=order,
                item=item,
                quantity=quantity,
                price_at_order=item.price
            )
        
        return order

# Serializer for the UserProfile model (extends User with additional info).
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)  # Username from related User.
    email = serializers.CharField(source='user.email', read_only=True)        # Email from related User.

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'mobile', 'age', 'gender', 'address']

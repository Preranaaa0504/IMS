from rest_framework import serializers
from django.contrib.auth.models import User
from .models import InventoryItem, UserProfile, Supplier, Order, OrderItem, Discount
import re
from rest_framework.exceptions import ValidationError

GST_REGEX = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'

class SupplierSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')
    gst_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['id', 'created_by']
        extra_kwargs = {
            'name': {'required': True},
            'address': {'required': True},
            'email': {'required': False},
            'phone': {'required': False},
        }

    def validate_gst_number(self, value):
        if value and not re.match(GST_REGEX, value):
            raise ValidationError('Invalid GST format. Expected format: 22AAAAA0000A1Z5')
        return value

class InventorySerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    supplier = SupplierSerializer(read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(),
        source='supplier',
        write_only=True,
        required=False,
        allow_null=True
    )
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'user', 'name', 'sku', 'quantity', 'price',
            'supplier', 'supplier_name', 'supplier_id',
            'expiration_date', 'threshold', 'created_at', 'updated_at'
        ]

    def validate_sku(self, value):
        if not value:
            raise ValidationError("SKU is required.")
        
        user = self.context['request'].user
        
        if self.instance:
            existing_items = InventoryItem.objects.filter(
                user=user, 
                sku=value
            ).exclude(id=self.instance.id)
        else:
            existing_items = InventoryItem.objects.filter(
                user=user, 
                sku=value
            )
        
        if existing_items.exists():
            raise ValidationError(f"An item with SKU '{value}' already exists in your inventory.")
        
        return value

class DiscountSerializer(serializers.ModelSerializer):
    value = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    
    class Meta:
        model = Discount
        fields = ['id', 'discount_type', 'value', 'description']
        read_only_fields = ['id']

class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    price_at_order = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = OrderItem
        fields = ['id', 'item', 'item_name', 'item_sku', 'quantity', 'price_at_order']
        read_only_fields = ['price_at_order']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source='order_items', many=True, read_only=True)
    user = serializers.CharField(source='user.username', read_only=True)
    discounts = DiscountSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'items', 'subtotal', 'total_amount', 
            'delivery_address', 'billing_name', 'billing_address', 'tax_id',
            'status', 'status_display', 'created_at', 'updated_at', 'discounts'
        ]
        read_only_fields = ['created_at', 'updated_at', 'subtotal', 'total_amount']

    def create(self, validated_data):
        items_data = self.context.get('items', [])
        discounts_data = self.context.get('discounts', [])
        
        subtotal = sum(
            float(InventoryItem.objects.get(id=item['id']).price) * item['quantity']
            for item in items_data
        )
        
        order = Order.objects.create(
            user=validated_data['user'],
            subtotal=subtotal,
            total_amount=subtotal,
            delivery_address=validated_data['delivery_address'],
            billing_name=validated_data.get('billing_name', ''),
            billing_address=validated_data['billing_address'],
            tax_id=validated_data.get('tax_id', '')
        )
        
        for item_data in items_data:
            item = InventoryItem.objects.get(id=item_data['id'])
            OrderItem.objects.create(
                order=order,
                item=item,
                quantity=item_data['quantity'],
                price_at_order=item.price
            )
        
        if discounts_data:
            order.apply_discounts(discounts_data)
        
        return order

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'mobile', 'age', 'gender', 'address']
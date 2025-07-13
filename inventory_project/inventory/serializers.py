from rest_framework import serializers
from django.contrib.auth.models import User
from .models import InventoryItem, UserProfile, Supplier, Order, OrderItem
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
            raise ValidationError({
                'gst_number': 'Invalid GST format. Expected format: 22AAAAA0000A1Z5'
            })
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

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'user', 'name', 'sku', 'quantity', 'price',
            'supplier', 'supplier_name', 'supplier_id',
            'expiration_date', 'threshold', 'created_at'
        ]

class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'item', 'item_name', 'item_sku', 'quantity', 'price_at_order']
        read_only_fields = ['price_at_order']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source='order_items', many=True, read_only=True)
    user = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'items', 'total_amount', 
            'delivery_address', 'billing_name', 'billing_address', 'tax_id',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'status']

    def create(self, validated_data):
        items_data = self.context.get('items', [])
        order = Order.objects.create(
            user=validated_data['user'],
            total_amount=validated_data['total_amount'],
            delivery_address=validated_data['delivery_address'],
            billing_name=validated_data.get('billing_name', ''),
            billing_address=validated_data['billing_address'],
            tax_id=validated_data.get('tax_id', '')
        )
        
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

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'mobile', 'age', 'gender', 'address']
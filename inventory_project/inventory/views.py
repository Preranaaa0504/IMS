from django.http import HttpResponse
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import viewsets, permissions, status
from django.core.exceptions import PermissionDenied
from django.db.models import F
from .models import InventoryItem, UserProfile, Supplier, Order, OrderItem
from .serializers import (
    InventorySerializer, 
    UserProfileSerializer, 
    SupplierSerializer, 
    OrderSerializer
)
from rest_framework.permissions import BasePermission, SAFE_METHODS
import csv

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff

class SupplierViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows suppliers to be viewed or edited.
    """
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Supplier.objects.filter(created_by=user)
        return Supplier.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class InventoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows inventory items to be viewed or edited.
    """
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return InventoryItem.objects.all()
        return InventoryItem.objects.filter(user=user)

    def perform_create(self, serializer):
        data = self.request.data
        current_user = self.request.user
        
        # Handle supplier
        supplier_id = data.get('supplier_id')
        supplier = None
        if supplier_id:
            try:
                supplier = Supplier.objects.get(id=supplier_id)
            except Supplier.DoesNotExist:
                raise PermissionDenied("Supplier does not exist")

        # Handle user assignment
        user_id = data.get('user_id')
        if current_user.is_staff and user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise PermissionDenied("User does not exist")
        else:
            user = current_user

        serializer.save(user=user, supplier=supplier)

class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows orders to be placed and managed.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        items = request.data.get('items', [])
        if not items:
            raise PermissionDenied("No items selected for order")

        # Calculate total amount
        total_amount = sum(
            InventoryItem.objects.get(id=item['id']).price * item['quantity']
            for item in items
        )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(
            user=request.user,
            total_amount=total_amount,
            delivery_address=request.data.get('delivery_address', ''),
            billing_name=request.data.get('billing_name', ''),
            billing_address=request.data.get('billing_address', ''),
            tax_id=request.data.get('tax_id', '')
        )

        # Create order items
        for item_data in items:
            item = InventoryItem.objects.get(id=item_data['id'])
            OrderItem.objects.create(
                order=order,
                item=item,
                quantity=item_data['quantity'],
                price_at_order=item.price
            )

        output_serializer = self.get_serializer(order)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_inventory_csv(request):
    """
    Export inventory data as CSV file
    """
    user = request.user
    items = InventoryItem.objects.all() if user.is_staff else InventoryItem.objects.filter(user=user)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="inventory.csv"'

    writer = csv.writer(response)
    writer.writerow(['Name', 'SKU', 'Quantity', 'Price', 'Supplier', 'Expiration Date', 'Threshold', 'Added By'])

    for item in items:
        writer.writerow([
            item.name,
            item.sku,
            item.quantity,
            item.price,
            item.supplier.name if item.supplier else '',
            item.expiration_date,
            item.threshold,
            item.user.username
        ])
    return response

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def low_stock_items(request):
    """
    Get list of items below threshold quantity
    """
    user = request.user
    items = InventoryItem.objects.filter(quantity__lt=F('threshold'))
    if not user.is_staff:
        items = items.filter(user=user)
    serializer = InventorySerializer(items, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """
    Register a new user with profile
    """
    data = request.data
    required_fields = ['username', 'password', 'email', 'mobile', 'age', 'gender', 'address']
    if not all(field in data for field in required_fields):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=data['username']).exists():
        return Response({'error': 'Username taken'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=data['username'],
        email=data['email'],
        password=data['password']
    )

    UserProfile.objects.create(
        user=user,
        mobile=data['mobile'],
        age=data['age'],
        gender=data['gender'],
        address=data['address']
    )

    return Response({'message': 'User registered'}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_current_user_info(request):
    """
    Get information about currently logged in user
    """
    user = request.user
    return Response({
        "username": user.username,
        "email": user.email,
        "is_staff": user.is_staff,
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_history(request):
    """
    Get order history for current user
    """
    user = request.user
    orders = Order.objects.filter(user=user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_order_status(request, pk):
    """
    Update order status (admin only)
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Only admin can update order status'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    new_status = request.data.get('status')
    if not new_status:
        return Response(
            {'error': 'Status is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    order.status = new_status
    order.save()
    
    return Response(
        {'message': f'Order status updated to {new_status}'},
        status=status.HTTP_200_OK
    )

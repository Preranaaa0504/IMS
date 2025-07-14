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
        
        supplier_id = data.get('supplier_id')
        supplier = None
        if supplier_id:
            try:
                supplier = Supplier.objects.get(id=supplier_id)
            except Supplier.DoesNotExist:
                raise PermissionDenied("Supplier does not exist")

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
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('status', None)
        
        queryset = Order.objects.all().order_by('-created_at')
        if not user.is_staff:
            queryset = queryset.filter(user=user)
        
        if status_filter and status_filter != 'ALL':
            queryset = queryset.filter(status=status_filter)
            
        return queryset

    def create(self, request, *args, **kwargs):
        items = request.data.get('items', [])
        discounts = request.data.get('discounts', [])
        
        if not items:
            raise PermissionDenied("No items selected for order")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        serializer.context['items'] = items
        serializer.context['discounts'] = discounts
        
        order = serializer.save(
            user=request.user,
            delivery_address=request.data.get('delivery_address', ''),
            billing_name=request.data.get('billing_name', ''),
            billing_address=request.data.get('billing_address', ''),
            tax_id=request.data.get('tax_id', '')
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_inventory_csv(request):
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
    user = request.user
    items = InventoryItem.objects.filter(quantity__lt=F('threshold'))
    if not user.is_staff:
        items = items.filter(user=user)
    serializer = InventorySerializer(items, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
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
    user = request.user
    return Response({
        "username": user.username,
        "email": user.email,
        "is_staff": user.is_staff,
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_history(request):
    user = request.user
    status_filter = request.query_params.get('status', None)
    
    orders = Order.objects.filter(user=user).order_by('-created_at')
    if status_filter and status_filter != 'ALL':
        orders = orders.filter(status=status_filter)
        
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_order_status(request, pk):
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
import { CustomerAddressDto } from './auth.models';

export interface ValidateCheckoutRequestDto {
  shippingAddressId: string;
  couponCode?: string;
}

export interface CheckoutItemValidationDto {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  quantityAvailable: number;
  isAvailable: boolean;
}

export interface VendorGroupedCheckoutDto {
  vendorId: string;
  vendorStoreName: string;
  commissionRate: number;
  subTotal: number;
  items: CheckoutItemValidationDto[];
}

export interface CheckoutValidationResultDto {
  isValid: boolean;
  errors: string[];
  cartId: string;
  shippingAddressId: string;
  shippingAddress?: CustomerAddressDto;
  subTotal: number;
  discountAmount: number;
  deliveryFee: number;
  grandTotal: number;
  couponCode?: string;
  vendorGroups: VendorGroupedCheckoutDto[];
}

export interface CreateOrderRequestDto {
  shippingAddressId: string;
  paymentMethod: 'COD' | 'Online' | string;
  couponCode?: string;
}

export interface OrderItemDto {
  id: string;
  vendorOrderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface VendorOrderDto {
  id: string;
  parentOrderId: string;
  vendorId: string;
  vendorStoreName: string;
  subOrderNumber: string;
  subTotal: number;
  commissionRate: number;
  commissionAmount: number;
  netEarnings: number;
  status: string;
  items: OrderItemDto[];
}

export interface PaymentDto {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  gatewayTransactionId?: string;
}

export interface OrderDto {
  id: string;
  customerId: string;
  orderNumber: string;
  shippingAddressId: string;
  shippingAddress?: CustomerAddressDto;
  subTotal: number;
  discountAmount: number;
  deliveryFee: number;
  grandTotal: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  vendorOrders: VendorOrderDto[];
  payment?: PaymentDto;
}

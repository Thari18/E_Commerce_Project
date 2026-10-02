export interface CartItemDto {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  quantityAvailable: number;
  isAvailable: boolean;
  vendorId: string;
  vendorStoreName: string;
}

export interface VendorGroupedCartDto {
  vendorId: string;
  vendorStoreName: string;
  items: CartItemDto[];
  subTotal: number;
}

export interface CartDto {
  id: string;
  customerId: string;
  vendorGroups: VendorGroupedCartDto[];
  totalItems: number;
  subTotal: number;
  estimatedDeliveryFee: number;
  grandTotal: number;
}

export interface AddToCartRequestDto {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequestDto {
  quantity: number;
}

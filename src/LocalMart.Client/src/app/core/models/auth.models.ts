export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface RegisterRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sku: string;
  status: string;
  imageUrl?: string;
  vendorName?: string;
}

export interface SearchProductsResponse {
  products: Product[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface ProductDetailDto {
  id: string;
  vendorId: string;
  vendorBusinessName: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: number;
  status: string;
  imageUrls: string[];
  quantityAvailable: number;
  inStock: boolean;
  createdAt: string;
}

export interface CustomerAddressDto {
  id: string;
  customerId: string;
  title: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressRequestDto {
  title: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateAddressRequestDto {
  title: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}



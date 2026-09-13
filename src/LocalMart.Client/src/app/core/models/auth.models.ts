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

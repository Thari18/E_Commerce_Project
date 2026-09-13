import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateProductRequest {
  categoryId: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  status: string;
  initialQuantity: number;
  lowStockThreshold: number;
  imageUrls?: { imageUrl: string; isPrimary: boolean }[];
}

export interface CreateProductResponse {
  productId: string;
  name: string;
  sku: string;
  price: number;
  status: string;
  quantityAvailable: number;
  createdAt: string;
  message: string;
}

export interface UpdateProductRequest {
  categoryId: string;
  name: string;
  description: string;
  sku: string;
  price: number;
}

export interface VendorProductItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: number;
  status: string;
  primaryImageUrl: string;
  quantityAvailable: number;
  quantityReserved: number;
  createdAt: string;
}

export interface VendorProductsResponse {
  products: VendorProductItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface VendorInventoryItem {
  inventoryId: string;
  productId: string;
  productName: string;
  productSku: string;
  productStatus: string;
  quantityAvailable: number;
  quantityReserved: number;
  totalPhysicalStock: number;
  lastUpdated: string;
}

export interface UpdateInventoryResponse {
  productId: string;
  quantityAvailable: number;
  quantityReserved: number;
  updatedAt: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class VendorCatalogService {
  private readonly baseUrl = `${environment.apiUrl}/vendor`;

  constructor(private http: HttpClient) {}

  getVendorProducts(status?: string, pageNumber: number = 1, pageSize: number = 20): Observable<VendorProductsResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<VendorProductsResponse>(`${this.baseUrl}/products`, { params });
  }

  createProduct(request: CreateProductRequest): Observable<CreateProductResponse> {
    return this.http.post<CreateProductResponse>(`${this.baseUrl}/products`, request);
  }

  updateProduct(id: string, request: UpdateProductRequest): Observable<VendorProductItem> {
    return this.http.put<VendorProductItem>(`${this.baseUrl}/products/${id}`, request);
  }

  updateProductStatus(id: string, status: string): Observable<VendorProductItem> {
    return this.http.put<VendorProductItem>(`${this.baseUrl}/products/${id}/status`, { status });
  }

  getVendorInventory(): Observable<VendorInventoryItem[]> {
    return this.http.get<VendorInventoryItem[]>(`${this.baseUrl}/inventory`);
  }

  updateInventory(productId: string, quantityAvailable: number): Observable<UpdateInventoryResponse> {
    return this.http.put<UpdateInventoryResponse>(`${this.baseUrl}/inventory/${productId}`, { quantityAvailable });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Category, Product, ProductDetailDto, SearchProductsResponse } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getProducts(categoryId?: string, search?: string): Observable<Product[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId);
    if (search) params = params.set('query', search);

    return this.http.get<SearchProductsResponse>(`${this.apiUrl}/products/search`, { params }).pipe(
      map(res => res.products || [])
    );
  }

  searchProducts(query?: string, categoryId?: string, pageNumber: number = 1, pageSize: number = 10): Observable<SearchProductsResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (query) params = params.set('query', query);
    if (categoryId) params = params.set('categoryId', categoryId);

    return this.http.get<SearchProductsResponse>(`${this.apiUrl}/products/search`, { params });
  }

  getProductDetail(idOrSlug: string): Observable<ProductDetailDto> {
    return this.http.get<ProductDetailDto>(`${this.apiUrl}/products/${idOrSlug}`);
  }
}


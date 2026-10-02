import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { CartDto, AddToCartRequestDto, UpdateCartItemRequestDto } from '../models/cart.models';
import { ToastService } from './toast.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/cart`;

  // Signals
  readonly cart = signal<CartDto | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isMutating = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computeds
  readonly itemCount = computed(() => this.cart()?.totalItems ?? 0);
  readonly vendorCount = computed(() => this.cart()?.vendorGroups?.length ?? 0);
  readonly subTotal = computed(() => this.cart()?.subTotal ?? 0);
  readonly deliveryFee = computed(() => this.cart()?.estimatedDeliveryFee ?? 0);
  readonly grandTotal = computed(() => this.cart()?.grandTotal ?? 0);
  readonly isEmpty = computed(() => (this.cart()?.totalItems ?? 0) === 0);

  constructor() {
    if (this.auth.isAuthenticated() && this.auth.hasRole('Customer')) {
      this.loadCart().subscribe({ error: () => {} });
    }
  }

  loadCart(): Observable<CartDto> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<CartDto>(this.apiUrl).pipe(
      tap(cart => {
        this.cart.set(cart);
        this.isLoading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.detail || err.error?.message || 'Failed to load shopping cart.';
        this.error.set(errorMsg);
        return throwError(() => err);
      })
    );
  }

  addItem(productId: string, quantity: number = 1): Observable<CartDto> {
    this.isMutating.set(true);
    const body: AddToCartRequestDto = { productId, quantity };

    return this.http.post<CartDto>(`${this.apiUrl}/items`, body).pipe(
      tap(updatedCart => {
        this.cart.set(updatedCart);
        this.isMutating.set(false);
        this.toast.success('Item added to cart successfully');
      }),
      catchError((err: HttpErrorResponse) => {
        this.isMutating.set(false);
        const errorMsg = err.error?.detail || err.error?.message || 'Failed to add item to cart.';
        this.toast.error(errorMsg);
        return throwError(() => err);
      })
    );
  }

  updateItem(itemId: string, quantity: number): Observable<CartDto> {
    this.isMutating.set(true);
    const body: UpdateCartItemRequestDto = { quantity };

    return this.http.put<CartDto>(`${this.apiUrl}/items/${itemId}`, body).pipe(
      tap(updatedCart => {
        this.cart.set(updatedCart);
        this.isMutating.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isMutating.set(false);
        const errorMsg = err.error?.detail || err.error?.message || 'Failed to update item quantity.';
        this.toast.error(errorMsg);
        return throwError(() => err);
      })
    );
  }

  removeItem(itemId: string): Observable<CartDto> {
    this.isMutating.set(true);

    return this.http.delete<CartDto>(`${this.apiUrl}/items/${itemId}`).pipe(
      tap(updatedCart => {
        this.cart.set(updatedCart);
        this.isMutating.set(false);
        this.toast.info('Item removed from cart');
      }),
      catchError((err: HttpErrorResponse) => {
        this.isMutating.set(false);
        const errorMsg = err.error?.detail || err.error?.message || 'Failed to remove item.';
        this.toast.error(errorMsg);
        return throwError(() => err);
      })
    );
  }

  clearCart(): Observable<CartDto> {
    this.isMutating.set(true);

    return this.http.delete<CartDto>(this.apiUrl).pipe(
      tap(updatedCart => {
        this.cart.set(updatedCart);
        this.isMutating.set(false);
        this.toast.info('Shopping cart cleared');
      }),
      catchError((err: HttpErrorResponse) => {
        this.isMutating.set(false);
        const errorMsg = err.error?.detail || err.error?.message || 'Failed to clear cart.';
        this.toast.error(errorMsg);
        return throwError(() => err);
      })
    );
  }
}

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CartService } from './cart.service';
import { ToastService } from './toast.service';
import { CartDto } from '../models/cart.models';
import { environment } from '../../../environments/environment';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  const mockCart: CartDto = {
    id: 'cart-1',
    customerId: 'cust-1',
    vendorGroups: [
      {
        vendorId: 'vendor-1',
        vendorStoreName: 'Green Organic Store',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Honeycrisp Apples',
            productSlug: 'honeycrisp-apples',
            productImageUrl: '/assets/placeholder.png',
            sku: 'APP-01',
            unitPrice: 4.99,
            quantity: 2,
            totalPrice: 9.98,
            quantityAvailable: 10,
            isAvailable: true,
            vendorId: 'vendor-1',
            vendorStoreName: 'Green Organic Store'
          }
        ],
        subTotal: 9.98
      }
    ],
    totalItems: 2,
    subTotal: 9.98,
    estimatedDeliveryFee: 5.00,
    grandTotal: 14.98
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CartService,
        ToastService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial null cart state', () => {
    expect(service.cart()).toBeNull();
    expect(service.itemCount()).toBe(0);
    expect(service.isEmpty()).toBeTrue();
  });

  it('should load cart successfully and update signals', () => {
    service.loadCart().subscribe(cart => {
      expect(cart).toEqual(mockCart);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCart);

    expect(service.cart()).toEqual(mockCart);
    expect(service.itemCount()).toBe(2);
    expect(service.vendorCount()).toBe(1);
    expect(service.subTotal()).toBe(9.98);
    expect(service.deliveryFee()).toBe(5.00);
    expect(service.grandTotal()).toBe(14.98);
    expect(service.isEmpty()).toBeFalse();
  });

  it('should add item to cart via POST /cart/items', () => {
    service.addItem('prod-1', 2).subscribe(cart => {
      expect(cart).toEqual(mockCart);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/cart/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ productId: 'prod-1', quantity: 2 });
    req.flush(mockCart);

    expect(service.cart()).toEqual(mockCart);
  });

  it('should update item quantity via PUT /cart/items/{id}', () => {
    service.updateItem('item-1', 3).subscribe(cart => {
      expect(cart).toEqual(mockCart);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/cart/items/item-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ quantity: 3 });
    req.flush(mockCart);

    expect(service.cart()).toEqual(mockCart);
  });

  it('should remove item via DELETE /cart/items/{id}', () => {
    service.removeItem('item-1').subscribe(cart => {
      expect(cart).toEqual(mockCart);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/cart/items/item-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockCart);

    expect(service.cart()).toEqual(mockCart);
  });

  it('should clear cart via DELETE /cart', () => {
    const emptyCartResponse: CartDto = {
      id: 'cart-1',
      customerId: 'cust-1',
      vendorGroups: [],
      totalItems: 0,
      subTotal: 0,
      estimatedDeliveryFee: 0,
      grandTotal: 0
    };

    service.clearCart().subscribe(cart => {
      expect(cart.totalItems).toBe(0);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
    expect(req.request.method).toBe('DELETE');
    req.flush(emptyCartResponse);

    expect(service.isEmpty()).toBeTrue();
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { environment } from '../../../environments/environment';
import { ValidateCheckoutRequestDto, CreateOrderRequestDto, OrderDto, CheckoutValidationResultDto } from '../models/order.models';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService]
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send POST request to validate checkout', () => {
    const request: ValidateCheckoutRequestDto = { shippingAddressId: 'addr-1', couponCode: 'SAVE10' };
    const mockResult: CheckoutValidationResultDto = {
      isValid: true,
      errors: [],
      cartId: 'cart-1',
      shippingAddressId: 'addr-1',
      subTotal: 50,
      discountAmount: 5,
      deliveryFee: 5,
      grandTotal: 50,
      vendorGroups: []
    };

    service.validateCheckout(request).subscribe(res => {
      expect(res).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/checkout/validate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResult);
  });

  it('should send POST request to create order with Idempotency-Key header', () => {
    const request: CreateOrderRequestDto = { shippingAddressId: 'addr-1', paymentMethod: 'COD' };
    const idempotencyKey = 'idemp-uuid-1234';
    const mockOrder: OrderDto = {
      id: 'ord-1',
      customerId: 'cust-1',
      orderNumber: 'ORD-100',
      shippingAddressId: 'addr-1',
      subTotal: 50,
      discountAmount: 0,
      deliveryFee: 5,
      grandTotal: 55,
      paymentStatus: 'Pending',
      paymentMethod: 'COD',
      createdAt: new Date().toISOString(),
      vendorOrders: []
    };

    service.createOrder(request, idempotencyKey).subscribe(res => {
      expect(res).toEqual(mockOrder);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/orders`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Idempotency-Key')).toBe(idempotencyKey);
    expect(req.request.body).toEqual(request);
    req.flush(mockOrder);
  });

  it('should send GET request for customer orders', () => {
    const mockOrders: OrderDto[] = [];
    service.getCustomerOrders().subscribe(res => {
      expect(res).toEqual(mockOrders);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/orders`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrders);
  });

  it('should send GET request for order by ID', () => {
    const orderId = 'ord-99';
    const mockOrder: OrderDto = {
      id: orderId,
      customerId: 'cust-1',
      orderNumber: 'ORD-99',
      shippingAddressId: 'addr-1',
      subTotal: 30,
      discountAmount: 0,
      deliveryFee: 5,
      grandTotal: 35,
      paymentStatus: 'Pending',
      paymentMethod: 'COD',
      createdAt: new Date().toISOString(),
      vendorOrders: []
    };

    service.getOrderById(orderId).subscribe(res => {
      expect(res).toEqual(mockOrder);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/orders/${orderId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrder);
  });
});

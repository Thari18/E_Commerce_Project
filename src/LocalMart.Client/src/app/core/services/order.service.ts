import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ValidateCheckoutRequestDto,
  CheckoutValidationResultDto,
  CreateOrderRequestDto,
  OrderDto
} from '../models/order.models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  validateCheckout(request: ValidateCheckoutRequestDto): Observable<CheckoutValidationResultDto> {
    return this.http.post<CheckoutValidationResultDto>(`${this.apiUrl}/checkout/validate`, request);
  }

  createOrder(request: CreateOrderRequestDto, idempotencyKey: string): Observable<OrderDto> {
    const headers = new HttpHeaders({
      'Idempotency-Key': idempotencyKey
    });
    return this.http.post<OrderDto>(`${this.apiUrl}/orders`, request, { headers });
  }

  getCustomerOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.apiUrl}/orders`);
  }

  getOrderById(id: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.apiUrl}/orders/${id}`);
  }
}

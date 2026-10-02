import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerAddressDto, CreateAddressRequestDto, UpdateAddressRequestDto } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAddresses(): Observable<CustomerAddressDto[]> {
    return this.http.get<CustomerAddressDto[]>(`${this.apiUrl}/customer/addresses`);
  }

  createAddress(request: CreateAddressRequestDto): Observable<CustomerAddressDto> {
    return this.http.post<CustomerAddressDto>(`${this.apiUrl}/customer/addresses`, request);
  }

  updateAddress(id: string, request: UpdateAddressRequestDto): Observable<CustomerAddressDto> {
    return this.http.put<CustomerAddressDto>(`${this.apiUrl}/customer/addresses/${id}`, request);
  }

  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/customer/addresses/${id}`);
  }

  setDefaultAddress(id: string): Observable<CustomerAddressDto> {
    return this.http.put<CustomerAddressDto>(`${this.apiUrl}/customer/addresses/${id}/default`, {});
  }
}

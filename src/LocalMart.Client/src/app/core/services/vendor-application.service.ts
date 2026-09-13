import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubmitVendorApplicationRequest {
  applicantUserId?: string;
  businessName: string;
  businessRegistrationNumber: string;
  taxIdentificationNumber?: string;
  contactPhone: string;
  contactEmail: string;
}

export interface VendorApplicationResponse {
  applicationId: string;
  status: string;
  submittedAt: string;
  message: string;
}

export interface VendorApplicationStatus {
  applicationId: string;
  businessName: string;
  status: string;
  rejectionReason?: string;
  submittedAt: string;
}

export interface VendorApplicationDetail {
  id: string;
  applicantUserId: string;
  applicantName: string;
  businessName: string;
  businessRegistrationNumber: string;
  taxIdentificationNumber?: string;
  contactPhone: string;
  contactEmail: string;
  status: string;
  rejectionReason?: string;
  reviewedByAdminId?: string;
  submittedAt: string;
  reviewedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VendorApplicationService {
  private apiUrl = 'http://localhost:5212/api/v1';

  constructor(private http: HttpClient) {}

  submitApplication(req: SubmitVendorApplicationRequest): Observable<VendorApplicationResponse> {
    return this.http.post<VendorApplicationResponse>(`${this.apiUrl}/vendors/applications`, req);
  }

  getApplicationStatus(applicationId?: string, email?: string): Observable<VendorApplicationStatus> {
    let params = new HttpParams();
    if (applicationId) params = params.set('applicationId', applicationId);
    if (email) params = params.set('email', email);

    return this.http.get<VendorApplicationStatus>(`${this.apiUrl}/vendors/applications/status`, { params });
  }

  getAdminApplications(statusFilter?: string): Observable<VendorApplicationDetail[]> {
    let params = new HttpParams();
    if (statusFilter) params = params.set('statusFilter', statusFilter);

    return this.http.get<VendorApplicationDetail[]>(`${this.apiUrl}/admin/vendors/applications`, { params });
  }

  getAdminApplicationById(id: string): Observable<VendorApplicationDetail> {
    return this.http.get<VendorApplicationDetail>(`${this.apiUrl}/admin/vendors/applications/${id}`);
  }

  approveApplication(id: string, commissionRate: number = 10.00): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/vendors/applications/${id}/approve`, { commissionRate });
  }

  rejectApplication(id: string, rejectionReason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/vendors/applications/${id}/reject`, { rejectionReason });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SubmitVendorApplicationRequest {
  applicantUserId?: string;

  // 1. Owner & Identity Details (Private Verification Assets)
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownershipType: string; // Individual, Partnership, Company
  residentialAddress?: string;
  idType?: string; // NationalId, Passport, DrivingLicense
  idNumber?: string;
  ownerPhotoRef?: string; // Private verification asset
  idDocumentRef?: string; // Private verification asset

  // 2. Business & Tax Details
  businessName: string;
  businessType: string; // RetailShop, Grocery, Bakery, Restaurant, etc.
  businessCategory: string;
  businessRegistrationNumber?: string;
  businessDescription?: string;
  businessRegistrationDate?: string;
  taxIdentificationNumber?: string; // TIN Number
  vatRegistrationNumber?: string; // VAT Number (distinct from TIN)
  contactPhone: string;
  contactEmail: string;
  websiteUrl?: string;
  socialMediaUrl?: string;

  // 3. Store Physical Location
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;

  // 4. Verification Documents (Private Verification Assets — Conditional based on policy)
  businessRegistrationCertificateRef?: string;
  tinCertificateRef?: string; // Document ref (distinct from TIN number)
  tradeLicenceRef?: string;
  otherLicenceRef?: string;

  // 5. Store Profile Assets (Public Storefront)
  storeFrontPhotoRef?: string;
  businessNameboardPhotoRef?: string;
  storeInteriorPhotoRef?: string;
  storeLogoRef?: string;

  // 6. Declarations
  termsAccepted: boolean;
  marketplacePolicyAccepted: boolean;
  informationAccuracyConfirmed: boolean;
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

  // Owner & Identity (Private Verification Assets)
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownershipType: string;
  residentialAddress?: string;
  idType?: string;
  idNumber?: string;
  ownerPhotoRef?: string;
  idDocumentRef?: string;

  // Business & Tax Details
  businessName: string;
  businessType: string;
  businessCategory: string;
  businessRegistrationNumber?: string;
  businessDescription?: string;
  businessRegistrationDate?: string;
  taxIdentificationNumber?: string;
  vatRegistrationNumber?: string;
  contactPhone: string;
  contactEmail: string;
  websiteUrl?: string;
  socialMediaUrl?: string;

  // Store Physical Location
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;

  // Verification Documents (Private Verification Assets)
  businessRegistrationCertificateRef?: string;
  tinCertificateRef?: string;
  tradeLicenceRef?: string;
  otherLicenceRef?: string;

  // Store Profile Assets (Public Storefront)
  storeFrontPhotoRef?: string;
  businessNameboardPhotoRef?: string;
  storeInteriorPhotoRef?: string;
  storeLogoRef?: string;

  // Declarations & Audit
  termsAccepted: boolean;
  marketplacePolicyAccepted: boolean;
  informationAccuracyConfirmed: boolean;
  termsAcceptedAt?: string;

  // Moderation Status
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
  private apiUrl = environment.apiUrl;

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

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendorApplicationService, VendorApplicationDetail } from '../../core/services/vendor-application.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 transition-colors duration-200">
      <!-- Admin Header -->
      <div class="bg-lm-surface rounded-3xl p-8 border border-lm-border mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <span class="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20 mb-2">
            Administrator Portal
          </span>
          <h1 class="text-3xl font-extrabold text-lm-text-main">System Governance & Operations</h1>
          <p class="text-lm-text-muted text-sm mt-1">Vendor Onboarding Moderation, Approvals & Platform Controls</p>
        </div>
        <div class="bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 text-blue-300 font-semibold text-xs">
          Role: Admin (vendors.approve, vendors.read)
        </div>
      </div>

      <!-- Moderation Section Header & Filters -->
      <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 mb-8 shadow-xl">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 class="text-xl font-bold text-lm-text-main">Vendor Applications Moderation</h2>
            <p class="text-xs text-lm-text-muted mt-0.5">Review structured merchant onboarding submissions (BR-001)</p>
          </div>
          <!-- Status Filter Pills -->
          <div class="flex gap-2 bg-lm-surface-elevated p-1 rounded-xl border border-lm-border">
            <button
              (click)="setFilter(null)"
              [class]="selectedFilter() === null ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20' : 'text-lm-text-muted hover:text-lm-text-main font-medium'"
              class="px-3 py-1.5 text-xs rounded-lg transition-all">
              All
            </button>
            <button
              (click)="setFilter('Pending')"
              [class]="selectedFilter() === 'Pending' ? 'bg-amber-600 text-white font-bold shadow-md' : 'text-lm-text-muted hover:text-lm-text-main font-medium'"
              class="px-3 py-1.5 text-xs rounded-lg transition-all">
              Pending
            </button>
            <button
              (click)="setFilter('Approved')"
              [class]="selectedFilter() === 'Approved' ? 'bg-emerald-600 text-white font-bold shadow-md' : 'text-lm-text-muted hover:text-lm-text-main font-medium'"
              class="px-3 py-1.5 text-xs rounded-lg transition-all">
              Approved
            </button>
            <button
              (click)="setFilter('Rejected')"
              [class]="selectedFilter() === 'Rejected' ? 'bg-rose-600 text-white font-bold shadow-md' : 'text-lm-text-muted hover:text-lm-text-main font-medium'"
              class="px-3 py-1.5 text-xs rounded-lg transition-all">
              Rejected
            </button>
          </div>
        </div>

        <!-- Success / Error Notice -->
        <div *ngIf="actionMessage()" class="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium">
          {{ actionMessage() }}
        </div>
        <div *ngIf="errorMessage()" class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
          {{ errorMessage() }}
        </div>

        <!-- Applications Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-lm-text-muted">
            <thead class="bg-lm-surface-elevated text-lm-text-muted uppercase tracking-wider text-[10px] border-b border-lm-border">
              <tr>
                <th class="p-4">Business / Type</th>
                <th class="p-4">Owner / Contact</th>
                <th class="p-4">Reg # & TIN</th>
                <th class="p-4">Location</th>
                <th class="p-4">Status</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-lm-border/60">
              <tr *ngFor="let app of applications()" class="hover:bg-lm-surface-elevated/60 transition-colors">
                <td class="p-4">
                  <div class="font-bold text-lm-text-main text-sm">{{ app.businessName }}</div>
                  <div class="text-blue-400 text-[11px] font-medium">{{ app.businessType }} • {{ app.ownershipType }}</div>
                </td>
                <td class="p-4">
                  <div class="text-lm-text-main font-semibold">{{ app.ownerFullName || app.applicantName }}</div>
                  <div class="text-lm-text-muted text-[11px]">{{ app.contactEmail }}</div>
                  <div class="text-lm-text-muted opacity-80 text-[10px]">{{ app.contactPhone }}</div>
                </td>
                <td class="p-4">
                  <div>Reg: <span class="text-lm-text-main font-mono font-medium">{{ app.businessRegistrationNumber }}</span></div>
                  <div class="text-lm-text-muted font-mono text-[11px]">TIN: {{ app.taxIdentificationNumber || 'N/A' }}</div>
                  <div *ngIf="app.vatRegistrationNumber" class="text-lm-text-muted opacity-80 font-mono text-[10px]">VAT: {{ app.vatRegistrationNumber }}</div>
                </td>
                <td class="p-4">
                  <div class="text-lm-text-main">{{ app.city }}, {{ app.district }}</div>
                  <div class="text-lm-text-muted text-[11px]">{{ app.province }}</div>
                </td>
                <td class="p-4">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" [ngClass]="{
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20': app.status === 'Pending' || app.status === 'UnderReview',
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': app.status === 'Approved',
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20': app.status === 'Rejected'
                  }">
                    {{ app.status }}
                  </span>
                </td>
                <td class="p-4 text-right space-x-2">
                  <button
                    (click)="openDetailModal(app)"
                    class="px-3 py-1.5 bg-lm-surface-elevated hover:bg-lm-border-hover text-lm-text-main font-semibold rounded-lg transition text-[11px] border border-lm-border">
                    Inspect
                  </button>

                  <button
                    *ngIf="app.status === 'Pending' || app.status === 'UnderReview'"
                    (click)="openApproveModal(app)"
                    class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition text-[11px] shadow-sm">
                    Approve
                  </button>

                  <button
                    *ngIf="app.status === 'Pending' || app.status === 'UnderReview'"
                    (click)="openRejectModal(app)"
                    class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition text-[11px] shadow-sm">
                    Reject
                  </button>
                </td>
              </tr>

              <tr *ngIf="applications().length === 0">
                <td colspan="6" class="p-8 text-center text-lm-text-muted">
                  No vendor applications found for selected filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ==================== APPLICATION DETAIL INSPECTION MODAL ==================== -->
      <div *ngIf="activeModal() === 'detail' && selectedApp()" class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8">
          
          <!-- Modal Header -->
          <div class="flex items-start justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold text-white">{{ selectedApp()?.businessName }}</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" [ngClass]="{
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20': selectedApp()?.status === 'Pending',
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': selectedApp()?.status === 'Approved',
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20': selectedApp()?.status === 'Rejected'
                }">
                  {{ selectedApp()?.status }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">Application ID: <span class="font-mono text-slate-300">{{ selectedApp()?.id }}</span></p>
            </div>
            <button (click)="closeModal()" class="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
          </div>

          <!-- Section 1: Owner & Identity Details (Confidential) -->
          <div class="mb-6 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">1. Applicant & Owner Identity</h4>
              <span class="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold rounded">
                Confidential Assets
              </span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">Full Name</span>
                <span class="text-white font-medium">{{ selectedApp()?.ownerFullName || selectedApp()?.applicantName }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">Email</span>
                <span class="text-white">{{ selectedApp()?.ownerEmail || selectedApp()?.contactEmail }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">Phone</span>
                <span class="text-white">{{ selectedApp()?.ownerPhone || selectedApp()?.contactPhone }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">Ownership Type</span>
                <span class="text-amber-400 font-semibold">{{ selectedApp()?.ownershipType }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">ID Type & Number</span>
                <span class="text-white">{{ selectedApp()?.idType || 'NIC' }}: {{ selectedApp()?.idNumber || 'Not specified' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">Owner Photo Reference</span>
                <span class="text-slate-300 font-mono text-[11px]">{{ selectedApp()?.ownerPhotoRef || 'None' }}</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Business & Tax Details -->
          <div class="mb-6 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs space-y-3">
            <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">2. Business Registry & Tax Data</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">Business Name</span>
                <span class="text-white font-semibold">{{ selectedApp()?.businessName }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">Trade Type</span>
                <span class="text-white">{{ selectedApp()?.businessType }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">Category</span>
                <span class="text-white">{{ selectedApp()?.businessCategory }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">Registration #</span>
                <span class="text-white font-mono">{{ selectedApp()?.businessRegistrationNumber }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">TIN Number</span>
                <span class="text-white font-mono">{{ selectedApp()?.taxIdentificationNumber || 'None' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">VAT Number</span>
                <span class="text-white font-mono">{{ selectedApp()?.vatRegistrationNumber || 'None' }}</span>
              </div>
            </div>
            <div *ngIf="selectedApp()?.businessDescription">
              <span class="text-slate-500 block text-[10px] uppercase">Description</span>
              <p class="text-slate-300 mt-0.5">{{ selectedApp()?.businessDescription }}</p>
            </div>
          </div>

          <!-- Section 3: Store Physical Location -->
          <div class="mb-6 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs">
            <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">3. Physical Store Location</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">Address</span>
                <span class="text-white">{{ selectedApp()?.addressLine1 }} {{ selectedApp()?.addressLine2 || '' }}</span>
                <div class="text-slate-400 mt-0.5">{{ selectedApp()?.city }}, {{ selectedApp()?.district }}, {{ selectedApp()?.province }} {{ selectedApp()?.postalCode }}</div>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase">GPS Coordinates</span>
                <span class="text-white font-mono">
                  Lat: {{ selectedApp()?.latitude || 'N/A' }}, Lng: {{ selectedApp()?.longitude || 'N/A' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Section 4: Verification Documents Audit -->
          <div class="mb-6 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs space-y-2">
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">4. Verification Documents (Restricted Audit)</h4>
              <span class="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold rounded">
                Admin Eyes Only
              </span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span class="text-slate-500 block text-[10px]">Business Registration Cert:</span>
                <span class="text-slate-300 font-mono">{{ selectedApp()?.businessRegistrationCertificateRef || 'Not provided' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">TIN Certificate:</span>
                <span class="text-slate-300 font-mono">{{ selectedApp()?.tinCertificateRef || 'Not provided' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">Trade Licence:</span>
                <span class="text-slate-300 font-mono">{{ selectedApp()?.tradeLicenceRef || 'Not provided' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">Other Licence:</span>
                <span class="text-slate-300 font-mono">{{ selectedApp()?.otherLicenceRef || 'Not provided' }}</span>
              </div>
            </div>
          </div>

          <!-- Section 5: Storefront Assets -->
          <div class="mb-6 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">5. Public Storefront Assets</h4>
              <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded">
                Storefront Bound
              </span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span class="text-slate-500 block text-[10px]">Storefront Photo:</span>
                <span class="text-slate-300 font-mono truncate block">{{ selectedApp()?.storeFrontPhotoRef || 'None' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">Store Logo:</span>
                <span class="text-slate-300 font-mono truncate block">{{ selectedApp()?.storeLogoRef || 'None' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">Nameboard:</span>
                <span class="text-slate-300 font-mono truncate block">{{ selectedApp()?.businessNameboardPhotoRef || 'None' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">Interior:</span>
                <span class="text-slate-300 font-mono truncate block">{{ selectedApp()?.storeInteriorPhotoRef || 'None' }}</span>
              </div>
            </div>
          </div>

          <!-- Modal Action Controls -->
          <div class="flex items-center justify-between pt-4 border-t border-slate-800">
            <button (click)="closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">
              Close Inspection
            </button>

            <div class="flex items-center gap-2" *ngIf="selectedApp()?.status === 'Pending' || selectedApp()?.status === 'UnderReview'">
              <button
                (click)="openRejectModal(selectedApp()!)"
                class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition">
                Reject Application
              </button>
              <button
                (click)="openApproveModal(selectedApp()!)"
                class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition">
                Approve & Provision Vendor
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Approve Modal -->
      <div *ngIf="activeModal() === 'approve'" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
          <h3 class="text-lg font-bold text-white mb-2">Approve Vendor Application</h3>
          <p class="text-xs text-slate-300 mb-4">
            Approving <span class="text-white font-bold">{{ selectedApp()?.businessName }}</span> will generate an active Vendor account and provision the <strong>Vendor Role</strong>.
          </p>

          <div class="mb-4">
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Provisional Commission Rate (%)</label>
            <p class="text-[10px] text-slate-400 mb-2">Commission financial base & rate policy remain Deferred per Decision #7</p>
            <input
              type="number"
              [(ngModel)]="commissionRate"
              min="0"
              max="100"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button (click)="closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">
              Cancel
            </button>
            <button (click)="submitApproval()" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs">
              Confirm Approval & Provision Role
            </button>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div *ngIf="activeModal() === 'reject'" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
          <h3 class="text-lg font-bold text-white mb-2">Reject Vendor Application</h3>
          <p class="text-xs text-slate-300 mb-4">
            Rejecting <span class="text-white font-bold">{{ selectedApp()?.businessName }}</span>. No Vendor account or privileges will be granted.
          </p>

          <div class="mb-4">
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Rejection Reason *</label>
            <textarea
              [(ngModel)]="rejectionReason"
              rows="3"
              placeholder="e.g. Incomplete or unverifiable business documentation provided."
              class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-rose-500"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button (click)="closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">
              Cancel
            </button>
            <button (click)="submitRejection()" [disabled]="!rejectionReason" class="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs disabled:opacity-50">
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  applications = signal<VendorApplicationDetail[]>([]);
  selectedFilter = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  activeModal = signal<'approve' | 'reject' | 'detail' | null>(null);
  selectedApp = signal<VendorApplicationDetail | null>(null);
  commissionRate = 10.00;
  rejectionReason = '';

  constructor(private vendorAppService: VendorApplicationService) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  setFilter(filter: string | null): void {
    this.selectedFilter.set(filter);
    this.loadApplications();
  }

  loadApplications(): void {
    this.vendorAppService.getAdminApplications(this.selectedFilter() || undefined).subscribe({
      next: (apps) => this.applications.set(apps),
      error: () => this.errorMessage.set('Failed to load vendor applications.')
    });
  }

  openDetailModal(app: VendorApplicationDetail): void {
    this.selectedApp.set(app);
    this.activeModal.set('detail');
  }

  openApproveModal(app: VendorApplicationDetail): void {
    this.selectedApp.set(app);
    this.commissionRate = 10.00;
    this.activeModal.set('approve');
  }

  openRejectModal(app: VendorApplicationDetail): void {
    this.selectedApp.set(app);
    this.rejectionReason = '';
    this.activeModal.set('reject');
  }

  closeModal(): void {
    this.activeModal.set(null);
    this.selectedApp.set(null);
  }

  submitApproval(): void {
    const app = this.selectedApp();
    if (!app) return;

    this.actionMessage.set(null);
    this.errorMessage.set(null);

    this.vendorAppService.approveApplication(app.id, this.commissionRate).subscribe({
      next: (res) => {
        this.actionMessage.set(res.message || `Approved application for ${app.businessName}`);
        this.closeModal();
        this.loadApplications();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Failed to approve application.');
        this.closeModal();
      }
    });
  }

  submitRejection(): void {
    const app = this.selectedApp();
    if (!app || !this.rejectionReason) return;

    this.actionMessage.set(null);
    this.errorMessage.set(null);

    this.vendorAppService.rejectApplication(app.id, this.rejectionReason).subscribe({
      next: (res) => {
        this.actionMessage.set(res.message || `Rejected application for ${app.businessName}`);
        this.closeModal();
        this.loadApplications();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Failed to reject application.');
        this.closeModal();
      }
    });
  }
}

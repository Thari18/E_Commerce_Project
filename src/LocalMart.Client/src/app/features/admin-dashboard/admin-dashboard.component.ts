import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendorApplicationService, VendorApplicationDetail } from '../../core/services/vendor-application.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Admin Header -->
      <div class="bg-slate-900 rounded-3xl p-8 border border-slate-800 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span class="inline-block px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full border border-purple-500/20 mb-2">
            Administrator Portal
          </span>
          <h1 class="text-3xl font-extrabold text-white">System Governance & Operations</h1>
          <p class="text-slate-400 text-sm mt-1">Vendor Onboarding Moderation, Approvals & Platform Controls</p>
        </div>
        <div class="bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20 text-purple-300 font-semibold text-xs">
          Role: Admin (vendors.approve)
        </div>
      </div>

      <!-- Moderation Section Header & Filters -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 class="text-xl font-bold text-white">Vendor Applications Moderation</h2>
            <p class="text-xs text-slate-400 mt-0.5">Review pending merchant onboarding submissions (BR-001)</p>
          </div>
          <!-- Status Filter Pills -->
          <div class="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              (click)="setFilter(null)"
              [class]="selectedFilter() === null ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1.5 text-xs font-semibold rounded-lg transition">
              All
            </button>
            <button
              (click)="setFilter('Pending')"
              [class]="selectedFilter() === 'Pending' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1.5 text-xs font-semibold rounded-lg transition">
              Pending
            </button>
            <button
              (click)="setFilter('Approved')"
              [class]="selectedFilter() === 'Approved' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1.5 text-xs font-semibold rounded-lg transition">
              Approved
            </button>
            <button
              (click)="setFilter('Rejected')"
              [class]="selectedFilter() === 'Rejected' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1.5 text-xs font-semibold rounded-lg transition">
              Rejected
            </button>
          </div>
        </div>

        <!-- Success / Error Notice -->
        <div *ngIf="actionMessage()" class="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
          {{ actionMessage() }}
        </div>
        <div *ngIf="errorMessage()" class="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
          {{ errorMessage() }}
        </div>

        <!-- Applications Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th class="p-4">Business / Applicant</th>
                <th class="p-4">Reg # & Tax ID</th>
                <th class="p-4">Contact</th>
                <th class="p-4">Status</th>
                <th class="p-4">Submitted At</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr *ngFor="let app of applications()" class="hover:bg-slate-800/30 transition">
                <td class="p-4">
                  <div class="font-bold text-white text-sm">{{ app.businessName }}</div>
                  <div class="text-slate-400 text-[11px]">Applicant: {{ app.applicantName }}</div>
                </td>
                <td class="p-4">
                  <div>Reg: <span class="text-white font-mono">{{ app.businessRegistrationNumber }}</span></div>
                  <div class="text-slate-400 font-mono text-[11px]">Tax: {{ app.taxIdentificationNumber || 'N/A' }}</div>
                </td>
                <td class="p-4">
                  <div>{{ app.contactEmail }}</div>
                  <div class="text-slate-400 text-[11px]">{{ app.contactPhone }}</div>
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
                <td class="p-4 text-slate-400">
                  {{ app.submittedAt | date:'mediumDate' }}
                </td>
                <td class="p-4 text-right space-x-2">
                  <button
                    *ngIf="app.status === 'Pending' || app.status === 'UnderReview'"
                    (click)="openApproveModal(app)"
                    class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition text-[11px]">
                    Approve
                  </button>
                  <button
                    *ngIf="app.status === 'Pending' || app.status === 'UnderReview'"
                    (click)="openRejectModal(app)"
                    class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition text-[11px]">
                    Reject
                  </button>
                  <span *ngIf="app.status !== 'Pending' && app.status !== 'UnderReview'" class="text-slate-500 text-[11px] italic">
                    Reviewed
                  </span>
                </td>
              </tr>

              <tr *ngIf="applications().length === 0">
                <td colspan="6" class="p-8 text-center text-slate-500">
                  No vendor applications found for selected filter.
                </td>
              </tr>
            </tbody>
          </table>
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
              placeholder="e.g. Invalid business registration documentation provided."
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

  activeModal = signal<'approve' | 'reject' | null>(null);
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
      error: (err) => this.errorMessage.set('Failed to load vendor applications.')
    });
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

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VendorApplicationService, VendorApplicationResponse, VendorApplicationStatus } from '../../core/services/vendor-application.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-vendor-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-12">
      <!-- Header Banner -->
      <div class="bg-slate-900 rounded-3xl p-8 border border-slate-800 mb-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 pointer-events-none"></div>
        <div class="relative z-10">
          <span class="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20 mb-3 inline-block">
            Merchant Onboarding
          </span>
          <h1 class="text-3xl md:text-4xl font-extrabold text-white">Apply to Become a LocalMart Vendor</h1>
          <p class="text-slate-300 text-sm mt-2 max-w-2xl">
            Expand your local business footprint. Sell fresh produce, bakery, dairy, and grocery items directly to neighborhood shoppers.
          </p>
        </div>
      </div>

      <!-- Governance Notice Card -->
      <div class="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 mb-8 flex gap-4 items-start">
        <div class="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-bold text-indigo-300 uppercase tracking-wide">Governance & Approval Process</h3>
          <p class="text-xs text-slate-300 mt-1 leading-relaxed">
            Public registration creates a Customer account only. Submitting this application creates a <strong>Pending Vendor Application</strong>. Vendor selling privileges and store management capabilities are granted strictly after Administrator review and approval.
          </p>
        </div>
      </div>

      <!-- Application Status View (If Submitted or Existing) -->
      <div *ngIf="applicationStatus()" class="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 text-center">
        <div class="inline-flex p-4 rounded-full mb-4" [ngClass]="{
          'bg-amber-500/10 text-amber-400 border border-amber-500/20': applicationStatus()?.status === 'Pending' || applicationStatus()?.status === 'UnderReview',
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': applicationStatus()?.status === 'Approved',
          'bg-rose-500/10 text-rose-400 border border-rose-500/20': applicationStatus()?.status === 'Rejected'
        }">
          <svg *ngIf="applicationStatus()?.status === 'Pending'" class="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <svg *ngIf="applicationStatus()?.status === 'Approved'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <svg *ngIf="applicationStatus()?.status === 'Rejected'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </div>

        <h2 class="text-2xl font-bold text-white mb-2">Application Status: {{ applicationStatus()?.status }}</h2>
        <p class="text-slate-400 text-sm max-w-md mx-auto">
          Business Name: <span class="text-white font-semibold">{{ applicationStatus()?.businessName }}</span>
        </p>

        <div *ngIf="applicationStatus()?.status === 'Rejected'" class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs text-left max-w-lg mx-auto">
          <strong>Rejection Reason:</strong> {{ applicationStatus()?.rejectionReason || 'Documentation did not meet criteria.' }}
        </div>

        <div *ngIf="applicationStatus()?.status === 'Approved'" class="mt-6">
          <a routerLink="/vendor/dashboard" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm transition">
            Go to Vendor Portal
          </a>
        </div>
      </div>

      <!-- Application Form -->
      <div *ngIf="!applicationStatus() || applicationStatus()?.status === 'Rejected'" class="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h2 class="text-xl font-bold text-white mb-6 pb-4 border-b border-slate-800">Business Details</h2>

        <form [formGroup]="appForm" (ngSubmit)="onSubmit()">
          <div *ngIf="errorMessage()" class="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {{ errorMessage() }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Business / Store Name *</label>
              <input
                type="text"
                formControlName="businessName"
                placeholder="e.g. Green Leaf Organics"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Business Registration Number *</label>
              <input
                type="text"
                formControlName="businessRegistrationNumber"
                placeholder="e.g. BRN-998822"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Tax Identification Number (Optional)</label>
              <input
                type="text"
                formControlName="taxIdentificationNumber"
                placeholder="e.g. TIN-112233"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Contact Phone *</label>
              <input
                type="text"
                formControlName="contactPhone"
                placeholder="e.g. +1 555-019-2834"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div class="mb-8">
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Contact Email *</label>
            <input
              type="email"
              formControlName="contactEmail"
              placeholder="e.g. vendor@business.com"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              [disabled]="appForm.invalid || loading()"
              class="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50">
              {{ loading() ? 'Submitting Application...' : 'Submit Vendor Application' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class VendorApplicationComponent implements OnInit {
  appForm: FormGroup;
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  applicationStatus = signal<VendorApplicationStatus | null>(null);

  constructor(
    private fb: FormBuilder,
    private vendorAppService: VendorApplicationService,
    private authService: AuthService
  ) {
    const user = this.authService.currentUser();
    this.appForm = this.fb.group({
      businessName: ['', [Validators.required, Validators.maxLength(150)]],
      businessRegistrationNumber: ['', [Validators.required, Validators.maxLength(100)]],
      taxIdentificationNumber: [''],
      contactPhone: [user?.phoneNumber || '', [Validators.required]],
      contactEmail: [user?.email || '', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.checkExistingStatus();
  }

  checkExistingStatus(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.vendorAppService.getApplicationStatus().subscribe({
        next: (status) => this.applicationStatus.set(status),
        error: () => {}
      });
    }
  }

  onSubmit(): void {
    if (this.appForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const user = this.authService.currentUser();
    const req = {
      applicantUserId: user?.id || undefined,
      ...this.appForm.value
    };

    this.vendorAppService.submitApplication(req).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.applicationStatus.set({
          applicationId: res.applicationId,
          businessName: this.appForm.value.businessName,
          status: res.status,
          submittedAt: res.submittedAt
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail || 'Failed to submit vendor application. Please try again.');
      }
    });
  }
}

import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VendorApplicationService, VendorApplicationResponse, VendorApplicationStatus } from '../../core/services/vendor-application.service';
import { AuthService } from '../../core/services/auth.service';

interface LocalFileInfo {
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
}

@Component({
  selector: 'app-vendor-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-10">
      <!-- Header Banner -->
      <div class="bg-slate-900 rounded-3xl p-8 border border-slate-800 mb-8 relative overflow-hidden shadow-2xl">
        <div class="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 pointer-events-none"></div>
        <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span class="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20 mb-3 inline-block">
              Merchant Onboarding Workflow
            </span>
            <h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Apply to Become a LocalMart Vendor</h1>
            <p class="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
              Join neighborhood merchants on LocalMart. Complete your applicant identity, business registry, physical store location, and verification details.
            </p>
          </div>
          <div class="shrink-0 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 text-center">
            <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Application Stage</div>
            <div class="text-amber-400 font-extrabold text-lg mt-0.5">Step {{ currentStep() }} of 6</div>
          </div>
        </div>
      </div>

      <!-- Governance Notice Card -->
      <div class="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 mb-8 flex gap-4 items-start">
        <div class="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="text-xs leading-relaxed text-slate-300">
          <span class="font-bold text-indigo-300 uppercase tracking-wide block mb-0.5">Governance & Privacy Architecture</span>
          Applicant identity and documents (<span class="text-amber-300 font-semibold">Owner Photo, ID, Registration Certificates, TIN, Trade Licences</span>) are <strong>Private Verification Assets</strong>. They are retained exclusively for administrative verification and compliance auditing. They are never exposed publicly on store profiles or customer catalog routes.
        </div>
      </div>

      <!-- Application Status View (If Already Submitted) -->
      <div *ngIf="applicationStatus()" class="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 text-center shadow-xl">
        <div class="inline-flex p-4 rounded-full mb-4" [ngClass]="{
          'bg-amber-500/10 text-amber-400 border border-amber-500/20': applicationStatus()?.status === 'Pending' || applicationStatus()?.status === 'UnderReview',
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': applicationStatus()?.status === 'Approved',
          'bg-rose-500/10 text-rose-400 border border-rose-500/20': applicationStatus()?.status === 'Rejected'
        }">
          <svg *ngIf="applicationStatus()?.status === 'Pending' || applicationStatus()?.status === 'UnderReview'" class="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
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
          <a routerLink="/vendor/dashboard" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition">
            Go to Vendor Portal
          </a>
        </div>
      </div>

      <!-- Application Wizard Form (If Not Submitted or Rejected) -->
      <div *ngIf="!applicationStatus() || applicationStatus()?.status === 'Rejected'" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        
        <!-- Step Navigation Bar -->
        <div class="grid grid-cols-2 md:grid-cols-6 gap-2 mb-8 pb-6 border-b border-slate-800">
          <button
            type="button"
            *ngFor="let step of steps; let i = index"
            (click)="goToStep(i + 1)"
            [disabled]="i + 1 > maxReachedStep()"
            class="text-left p-2.5 rounded-xl border transition flex flex-col justify-between"
            [ngClass]="{
              'bg-amber-500/15 border-amber-500/40 text-amber-400': currentStep() === (i + 1),
              'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white': currentStep() !== (i + 1) && (i + 1) <= maxReachedStep(),
              'opacity-40 border-slate-800/40 text-slate-600 cursor-not-allowed': (i + 1) > maxReachedStep()
            }">
            <div class="text-[10px] font-bold uppercase tracking-wider">Step {{ i + 1 }}</div>
            <div class="text-xs font-semibold truncate">{{ step.title }}</div>
          </button>
        </div>

        <form [formGroup]="appForm" (ngSubmit)="onSubmit()">
          
          <div *ngIf="errorMessage()" class="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {{ errorMessage() }}
          </div>

          <!-- ==================== STEP 1: OWNER & IDENTITY DETAILS ==================== -->
          <div *ngIf="currentStep() === 1" class="space-y-6">
            <div>
              <h2 class="text-xl font-bold text-white">1. Owner & Identity Details</h2>
              <p class="text-slate-400 text-xs mt-1">Information regarding the primary business owner or authorized legal signatory.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Owner Full Name *</label>
                <input
                  type="text"
                  formControlName="ownerFullName"
                  placeholder="e.g. Jane Doe"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Owner Email *</label>
                <input
                  type="email"
                  formControlName="ownerEmail"
                  placeholder="e.g. jane.doe@business.com"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Owner Contact Phone *</label>
                <input
                  type="tel"
                  formControlName="ownerPhone"
                  placeholder="e.g. +94 77 123 4567"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Ownership Type *</label>
                <select
                  formControlName="ownershipType"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500">
                  <option value="Individual">Individual / Sole Proprietor</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Company">Private Limited / Company</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Identification Type</label>
                <select
                  formControlName="idType"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500">
                  <option value="NationalId">National Identity Card (NIC)</option>
                  <option value="Passport">Passport</option>
                  <option value="DrivingLicense">Driving License</option>
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">ID / Passport Number</label>
                <input
                  type="text"
                  formControlName="idNumber"
                  placeholder="e.g. 199012345678"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Residential Address</label>
              <input
                type="text"
                formControlName="residentialAddress"
                placeholder="e.g. 12/B Temple Road, Colombo"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <!-- Owner Photo (Private Verification Asset) -->
            <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <span class="text-xs font-bold text-slate-200">Owner Photograph</span>
                  <span class="ml-2 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold rounded">
                    Private Verification Asset
                  </span>
                </div>
                <span class="text-[11px] text-slate-400">JPG, PNG (Max 5MB)</span>
              </div>
              <p class="text-xs text-slate-400 mb-3">Used for merchant identity verification only. Strictly never published to store profiles.</p>
              
              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  (change)="onFileSelected($event, 'ownerPhoto')"
                  class="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
                
                <div *ngIf="files['ownerPhoto']" class="flex items-center gap-2 text-xs text-emerald-400">
                  <span>Selected: {{ files['ownerPhoto'].name }} ({{ files['ownerPhoto'].size }})</span>
                </div>
              </div>

              <div class="mt-2 text-[11px] text-amber-400/80 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Upload Status: Selected locally — Cloudinary signed-upload API endpoint pending architect decision.
              </div>
            </div>
          </div>

          <!-- ==================== STEP 2: BUSINESS & TAX DETAILS ==================== -->
          <div *ngIf="currentStep() === 2" class="space-y-6">
            <div>
              <h2 class="text-xl font-bold text-white">2. Business & Tax Information</h2>
              <p class="text-slate-400 text-xs mt-1">Commercial details, trade classification, and tax registration identifiers.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Business / Store Name *</label>
                <input
                  type="text"
                  formControlName="businessName"
                  placeholder="e.g. Fresh Valley Groceries"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Business Type (Trade Category) *</label>
                <select
                  formControlName="businessType"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500">
                  <option value="RetailShop">Retail Shop</option>
                  <option value="Grocery">Grocery & Fresh Produce</option>
                  <option value="Bakery">Bakery & Confectionery</option>
                  <option value="Restaurant">Restaurant & Prepared Foods</option>
                  <option value="Clothing">Clothing & Apparel</option>
                  <option value="Electronics">Electronics & Hardware</option>
                  <option value="Pharmacy">Pharmacy & Healthcare</option>
                  <option value="Other">Other Category</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Business Category *</label>
                <input
                  type="text"
                  formControlName="businessCategory"
                  placeholder="e.g. Organic Produce & Daily Pantry"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Business Registration Number (If Applicable)</label>
                <input
                  type="text"
                  formControlName="businessRegistrationNumber"
                  placeholder="e.g. PV-0029384"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <!-- Distinct TIN vs VAT Registration Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Tax Identification Number (TIN Number)
                </label>
                <input
                  type="text"
                  formControlName="taxIdentificationNumber"
                  placeholder="e.g. TIN-99882233"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
                <span class="text-[11px] text-slate-400 mt-1 block">The alphanumeric TIN number assigned to your business.</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  VAT Registration Number (Optional)
                </label>
                <input
                  type="text"
                  formControlName="vatRegistrationNumber"
                  placeholder="e.g. VAT-11223344"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
                <span class="text-[11px] text-slate-400 mt-1 block">Value Added Tax registration number (if registered).</span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Store Contact Phone *</label>
                <input
                  type="tel"
                  formControlName="contactPhone"
                  placeholder="e.g. +94 11 234 5678"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Store Contact Email *</label>
                <input
                  type="email"
                  formControlName="contactEmail"
                  placeholder="e.g. store@freshvalley.com"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Business Description</label>
              <textarea
                formControlName="businessDescription"
                rows="3"
                placeholder="Briefly describe your products, specializations, and operating history..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
              ></textarea>
            </div>
          </div>

          <!-- ==================== STEP 3: PHYSICAL STORE LOCATION ==================== -->
          <div *ngIf="currentStep() === 3" class="space-y-6">
            <div>
              <h2 class="text-xl font-bold text-white">3. Store Physical Location</h2>
              <p class="text-slate-400 text-xs mt-1">Physical address for customer store discovery, radius calculation, and delivery dispatch.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Address Line 1 *</label>
                <input
                  type="text"
                  formControlName="addressLine1"
                  placeholder="e.g. 108 Galle Road"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  formControlName="addressLine2"
                  placeholder="e.g. Building 4, Floor 1"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">City *</label>
                <input
                  type="text"
                  formControlName="city"
                  placeholder="e.g. Colombo"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">District *</label>
                <input
                  type="text"
                  formControlName="district"
                  placeholder="e.g. Colombo"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Province *</label>
                <input
                  type="text"
                  formControlName="province"
                  placeholder="e.g. Western"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Postal Code *</label>
                <input
                  type="text"
                  formControlName="postalCode"
                  placeholder="e.g. 00300"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <!-- Geographic Coordinates Helper -->
            <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-slate-200">Store GPS Coordinates</span>
                <button
                  type="button"
                  (click)="detectLocation()"
                  class="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-lg text-xs font-semibold transition flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Detect My Location
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    formControlName="latitude"
                    placeholder="e.g. 6.9271"
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    formControlName="longitude"
                    placeholder="e.g. 79.8612"
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== STEP 4: VERIFICATION DOCUMENTS ==================== -->
          <div *ngIf="currentStep() === 4" class="space-y-6">
            <div>
              <h2 class="text-xl font-bold text-white">4. Verification Documents</h2>
              <p class="text-slate-400 text-xs mt-1">Official certificates and licensing assets. Document policies vary based on business type and ownership structure.</p>
            </div>

            <div class="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300/90 text-xs">
              <strong>Policy Note:</strong> Verification documents are evaluated conditionally. Companies and Partnerships typically require a Business Registration Certificate. If you provided a TIN number, submitting your TIN certificate accelerates verification.
            </div>

            <!-- Documents Grid -->
            <div class="space-y-4">
              
              <!-- 1. Business Registration Certificate -->
              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs font-bold text-slate-200">Business Registration Certificate (BRC)</div>
                  <span class="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold rounded">Private Asset</span>
                </div>
                <p class="text-[11px] text-slate-400 mb-3">Official registrar document certifying your commercial registration.</p>
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    (change)="onFileSelected($event, 'brc')"
                    class="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />
                  <div *ngIf="files['brc']" class="text-xs text-emerald-400">
                    Selected: {{ files['brc'].name }} ({{ files['brc'].size }})
                  </div>
                </div>
                <div class="mt-2 text-[11px] text-amber-400/80">
                  Status: Selected locally — Secure Cloudinary upload contract pending architect API decision.
                </div>
              </div>

              <!-- 2. TIN Certificate -->
              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs font-bold text-slate-200">TIN Certificate (Document Copy)</div>
                  <span class="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold rounded">Private Asset</span>
                </div>
                <p class="text-[11px] text-slate-400 mb-3">Document certifying your Tax Identification Number (distinct from the alphanumeric TIN number).</p>
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    (change)="onFileSelected($event, 'tinCert')"
                    class="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />
                  <div *ngIf="files['tinCert']" class="text-xs text-emerald-400">
                    Selected: {{ files['tinCert'].name }} ({{ files['tinCert'].size }})
                  </div>
                </div>
                <div class="mt-2 text-[11px] text-amber-400/80">
                  Status: Selected locally — Secure Cloudinary upload contract pending architect API decision.
                </div>
              </div>

              <!-- 3. Trade Licence -->
              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs font-bold text-slate-200">Municipal Trade Licence (Conditional)</div>
                  <span class="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold rounded">Private Asset</span>
                </div>
                <p class="text-[11px] text-slate-400 mb-3">Local government / municipal commercial trade permit where required.</p>
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    (change)="onFileSelected($event, 'tradeLicence')"
                    class="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />
                  <div *ngIf="files['tradeLicence']" class="text-xs text-emerald-400">
                    Selected: {{ files['tradeLicence'].name }} ({{ files['tradeLicence'].size }})
                  </div>
                </div>
              </div>

              <!-- 4. Other Licence / Certification -->
              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs font-bold text-slate-200">Other Industry Licence (Optional)</div>
                  <span class="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold rounded">Private Asset</span>
                </div>
                <p class="text-[11px] text-slate-400 mb-3">Food handling certificate, liquor permit, organic certification, etc.</p>
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    (change)="onFileSelected($event, 'otherLicence')"
                    class="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />
                  <div *ngIf="files['otherLicence']" class="text-xs text-emerald-400">
                    Selected: {{ files['otherLicence'].name }} ({{ files['otherLicence'].size }})
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== STEP 5: STORE PROFILE ASSETS ==================== -->
          <div *ngIf="currentStep() === 5" class="space-y-6">
            <div>
              <h2 class="text-xl font-bold text-white">5. Public Storefront Assets</h2>
              <p class="text-slate-400 text-xs mt-1">Visual assets displayed on your public storefront and marketplace listings once approved.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Storefront Photo -->
              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-200">Storefront Photo</span>
                  <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded">Public Asset</span>
                </div>
                <p class="text-[11px] text-slate-400 mb-3">External view of your shop entrance.</p>
                
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  (change)="onFileSelected($event, 'storefront', true)"
                  class="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />

                <div *ngIf="files['storefront']" class="mt-3">
                  <img *ngIf="files['storefront'].previewUrl" [src]="files['storefront'].previewUrl" class="h-28 w-full object-cover rounded-xl border border-slate-700" />
                  <span class="text-[10px] text-emerald-400 block mt-1">Local Preview: {{ files['storefront'].name }}</span>
                </div>
              </div>

              <!-- Store Logo -->
              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-200">Store Logo / Brand Icon</span>
                  <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded">Public Asset</span>
                </div>
                <p class="text-[11px] text-slate-400 mb-3">Square brand logo for catalog badges.</p>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  (change)="onFileSelected($event, 'logo', true)"
                  class="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />

                <div *ngIf="files['logo']" class="mt-3">
                  <img *ngIf="files['logo'].previewUrl" [src]="files['logo'].previewUrl" class="h-20 w-20 object-cover rounded-xl border border-slate-700" />
                  <span class="text-[10px] text-emerald-400 block mt-1">Local Preview: {{ files['logo'].name }}</span>
                </div>
              </div>

              <!-- Nameboard Photo -->
              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-200">Business Nameboard</span>
                  <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded">Public Asset</span>
                </div>
                <p class="text-[11px] text-slate-400 mb-3">Signage or physical nameboard of the store.</p>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  (change)="onFileSelected($event, 'nameboard', true)"
                  class="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <!-- Interior Photo -->
              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-200">Store Interior Photo</span>
                  <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded">Public Asset</span>
                </div>
                <p class="text-[11px] text-slate-400 mb-3">Inside view showing product displays.</p>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  (change)="onFileSelected($event, 'interior', true)"
                  class="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <!-- ==================== STEP 6: DECLARATION & SUMMARY ==================== -->
          <div *ngIf="currentStep() === 6" class="space-y-6">
            <div>
              <h2 class="text-xl font-bold text-white">6. Review & Declarations</h2>
              <p class="text-slate-400 text-xs mt-1">Review your application summary and confirm required legal declarations.</p>
            </div>

            <!-- Summary Review Card -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-xs space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span class="text-slate-500 block uppercase font-bold text-[10px]">Owner</span>
                  <span class="text-white font-semibold">{{ appForm.value.ownerFullName }}</span>
                  <span class="text-slate-400 block">{{ appForm.value.ownerEmail }}</span>
                </div>
                <div>
                  <span class="text-slate-500 block uppercase font-bold text-[10px]">Business & Type</span>
                  <span class="text-white font-semibold">{{ appForm.value.businessName }}</span>
                  <span class="text-slate-400 block">{{ appForm.value.businessType }} ({{ appForm.value.ownershipType }})</span>
                </div>
                <div>
                  <span class="text-slate-500 block uppercase font-bold text-[10px]">Reg & TIN Number</span>
                  <span class="text-white font-semibold">BRN: {{ appForm.value.businessRegistrationNumber }}</span>
                  <span class="text-slate-400 block">TIN: {{ appForm.value.taxIdentificationNumber || 'None' }}</span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span class="text-slate-500 block uppercase font-bold text-[10px]">Location</span>
                  <span class="text-slate-300">{{ appForm.value.addressLine1 }}, {{ appForm.value.city }}, {{ appForm.value.district }}</span>
                </div>
                <div>
                  <span class="text-slate-500 block uppercase font-bold text-[10px]">Verification Assets Selected</span>
                  <span class="text-slate-300">
                    {{ countSelectedFiles() }} document/image assets selected locally.
                  </span>
                </div>
              </div>
            </div>

            <!-- Mandatory Legal Checkboxes -->
            <div class="space-y-3 pt-2">
              <label class="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="termsAccepted"
                  class="mt-0.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>I agree to the <strong>LocalMart Terms and Conditions</strong> for marketplace sellers. *</span>
              </label>

              <label class="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="marketplacePolicyAccepted"
                  class="mt-0.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>I agree to comply with the <strong>LocalMart Marketplace Vendor Quality & Delivery Policy</strong>. *</span>
              </label>

              <label class="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="informationAccuracyConfirmed"
                  class="mt-0.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>I declare and confirm that all information and documentation provided in this application are authentic and accurate. *</span>
              </label>
            </div>
          </div>

          <!-- Wizard Footer Navigation Buttons -->
          <div class="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              *ngIf="currentStep() > 1"
              (click)="previousStep()"
              class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition">
              ← Back
            </button>
            <div *ngIf="currentStep() === 1"></div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                *ngIf="currentStep() < 6"
                (click)="nextStep()"
                class="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20">
                Continue to Next Step →
              </button>

              <button
                type="submit"
                *ngIf="currentStep() === 6"
                [disabled]="appForm.invalid || loading()"
                class="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer">
                {{ loading() ? 'Submitting Application...' : 'Submit Vendor Application' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
})
export class VendorApplicationComponent implements OnInit, OnDestroy {
  currentStep = signal<number>(1);
  maxReachedStep = signal<number>(1);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  applicationStatus = signal<VendorApplicationStatus | null>(null);

  files: { [key: string]: LocalFileInfo } = {};

  steps = [
    { title: 'Owner Details' },
    { title: 'Business Info' },
    { title: 'Store Location' },
    { title: 'Documents' },
    { title: 'Store Photos' },
    { title: 'Declaration' }
  ];

  appForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private vendorAppService: VendorApplicationService,
    private authService: AuthService
  ) {
    const user = this.authService.currentUser();
    this.appForm = this.fb.group({
      // Step 1: Owner
      ownerFullName: [user ? `${user.firstName} ${user.lastName}`.trim() : '', [Validators.required, Validators.maxLength(150)]],
      ownerEmail: [user?.email || '', [Validators.required, Validators.email, Validators.maxLength(255)]],
      ownerPhone: [user?.phoneNumber || '', [Validators.required, Validators.maxLength(30)]],
      ownershipType: ['Individual', [Validators.required]],
      idType: ['NationalId'],
      idNumber: [''],
      residentialAddress: [''],

      // Step 2: Business & Tax
      businessName: ['', [Validators.required, Validators.maxLength(150)]],
      businessType: ['RetailShop', [Validators.required]],
      businessCategory: ['', [Validators.required, Validators.maxLength(100)]],
      businessRegistrationNumber: ['', [Validators.maxLength(100)]],
      taxIdentificationNumber: [''],
      vatRegistrationNumber: [''],
      contactPhone: [user?.phoneNumber || '', [Validators.required]],
      contactEmail: [user?.email || '', [Validators.required, Validators.email]],
      businessDescription: [''],

      // Step 3: Location
      addressLine1: ['', [Validators.required, Validators.maxLength(255)]],
      addressLine2: [''],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      district: ['', [Validators.required, Validators.maxLength(100)]],
      province: ['', [Validators.required, Validators.maxLength(100)]],
      postalCode: ['', [Validators.required, Validators.maxLength(20)]],
      latitude: [null],
      longitude: [null],

      // Step 6: Declarations
      termsAccepted: [false, [Validators.requiredTrue]],
      marketplacePolicyAccepted: [false, [Validators.requiredTrue]],
      informationAccuracyConfirmed: [false, [Validators.requiredTrue]]
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

  goToStep(step: number): void {
    if (step <= this.maxReachedStep()) {
      this.currentStep.set(step);
    }
  }

  nextStep(): void {
    if (this.currentStep() < 6) {
      const next = this.currentStep() + 1;
      this.currentStep.set(next);
      if (next > this.maxReachedStep()) {
        this.maxReachedStep.set(next);
      }
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  onFileSelected(event: Event, fieldKey: string, generatePreview = false): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];

      // Enforce 5MB limit
      const maxSizeBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        this.errorMessage.set(`File "${file.name}" exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a smaller file.`);
        target.value = '';
        return;
      }

      // Enforce allowed formats
      const allowedExtensions = generatePreview ? ['.jpg', '.jpeg', '.png'] : ['.pdf', '.jpg', '.jpeg', '.png'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        this.errorMessage.set(`File "${file.name}" has an unsupported format. Allowed formats: ${allowedExtensions.join(', ')}.`);
        target.value = '';
        return;
      }

      // Safely revoke previous object URL if replacing
      if (this.files[fieldKey]?.previewUrl) {
        URL.revokeObjectURL(this.files[fieldKey].previewUrl!);
      }

      const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
      let previewUrl: string | undefined;

      if (generatePreview && file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      this.files[fieldKey] = {
        name: file.name,
        size: sizeKb,
        type: file.type,
        previewUrl
      };
      this.errorMessage.set(null);
    }
  }

  ngOnDestroy(): void {
    // Safely revoke all created object URLs on component destruction
    Object.values(this.files).forEach(f => {
      if (f.previewUrl) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
  }

  countSelectedFiles(): number {
    return Object.keys(this.files).length;
  }

  detectLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.appForm.patchValue({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6))
          });
        },
        () => {
          this.errorMessage.set('Could not automatically retrieve GPS coordinates. You may enter them manually.');
        }
      );
    }
  }

  onSubmit(): void {
    if (this.appForm.invalid) {
      this.errorMessage.set('Please ensure all required fields and declarations are completed before submitting.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const user = this.authService.currentUser();
    const formVal = this.appForm.value;

    const req = {
      applicantUserId: user?.id || undefined,
      ownerFullName: formVal.ownerFullName,
      ownerEmail: formVal.ownerEmail,
      ownerPhone: formVal.ownerPhone,
      ownershipType: formVal.ownershipType,
      residentialAddress: formVal.residentialAddress || undefined,
      idType: formVal.idType || undefined,
      idNumber: formVal.idNumber || undefined,
      ownerPhotoRef: this.files['ownerPhoto'] ? `local_selected://${this.files['ownerPhoto'].name}` : undefined,
      idDocumentRef: undefined,

      businessName: formVal.businessName,
      businessType: formVal.businessType,
      businessCategory: formVal.businessCategory,
      businessRegistrationNumber: formVal.businessRegistrationNumber,
      businessDescription: formVal.businessDescription || undefined,
      taxIdentificationNumber: formVal.taxIdentificationNumber || undefined,
      vatRegistrationNumber: formVal.vatRegistrationNumber || undefined,
      contactPhone: formVal.contactPhone,
      contactEmail: formVal.contactEmail,

      addressLine1: formVal.addressLine1,
      addressLine2: formVal.addressLine2 || undefined,
      city: formVal.city,
      district: formVal.district,
      province: formVal.province,
      postalCode: formVal.postalCode,
      latitude: formVal.latitude || undefined,
      longitude: formVal.longitude || undefined,

      businessRegistrationCertificateRef: this.files['brc'] ? `local_selected://${this.files['brc'].name}` : undefined,
      tinCertificateRef: this.files['tinCert'] ? `local_selected://${this.files['tinCert'].name}` : undefined,
      tradeLicenceRef: this.files['tradeLicence'] ? `local_selected://${this.files['tradeLicence'].name}` : undefined,
      otherLicenceRef: this.files['otherLicence'] ? `local_selected://${this.files['otherLicence'].name}` : undefined,

      storeFrontPhotoRef: this.files['storefront'] ? `local_selected://${this.files['storefront'].name}` : undefined,
      businessNameboardPhotoRef: this.files['nameboard'] ? `local_selected://${this.files['nameboard'].name}` : undefined,
      storeInteriorPhotoRef: this.files['interior'] ? `local_selected://${this.files['interior'].name}` : undefined,
      storeLogoRef: this.files['logo'] ? `local_selected://${this.files['logo'].name}` : undefined,

      termsAccepted: formVal.termsAccepted,
      marketplacePolicyAccepted: formVal.marketplacePolicyAccepted,
      informationAccuracyConfirmed: formVal.informationAccuracyConfirmed
    };

    this.vendorAppService.submitApplication(req).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.applicationStatus.set({
          applicationId: res.applicationId,
          businessName: formVal.businessName,
          status: res.status,
          submittedAt: res.submittedAt
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail || 'Failed to submit vendor application. Please verify your inputs.');
      }
    });
  }
}

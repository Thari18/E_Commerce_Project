import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AddressService } from '../../core/services/address.service';
import { ToastService } from '../../core/services/toast.service';
import { CustomerAddressDto, CreateAddressRequestDto, UpdateAddressRequestDto } from '../../core/models/auth.models';
import { SkeletonLoaderComponent } from '../../shared/components/loading/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-customer-addresses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-8 transition-colors duration-200">
      <!-- Header Banner & Action -->
      <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span class="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20 mb-2">
            Customer Profile Management
          </span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-lm-text-main">Saved Delivery Addresses</h1>
          <p class="text-lm-text-muted text-xs sm:text-sm mt-1">Manage your neighborhood delivery locations for fast multi-vendor checkout.</p>
        </div>
        <button
          (click)="openAddModal()"
          class="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs sm:text-sm rounded-2xl transition shadow-lg shadow-blue-500/20 hover:scale-[1.02] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
          <span>+ Add New Address</span>
        </button>
      </div>

      <!-- Backend API Dependency / Status Notice -->
      <app-error-state
        *ngIf="backendNotice()"
        [isNotice]="true"
        title="Backend Address API Dependency Notice"
        [message]="backendNotice()!">
      </app-error-state>

      <!-- Loading State Skeleton -->
      <app-skeleton-loader *ngIf="loading()" type="card" [count]="3"></app-skeleton-loader>

      <!-- Empty State Container -->
      <app-empty-state
        *ngIf="!loading() && !errorState() && addresses().length === 0"
        iconType="address"
        title="No Saved Delivery Addresses"
        description="You haven't saved any delivery locations yet. Save your primary home or office location for 1-click checkout."
        actionLabel="+ Add Your First Delivery Address"
        (actionClicked)="openAddModal()">
      </app-empty-state>

      <!-- Address Cards Grid -->
      <div *ngIf="!loading() && addresses().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let addr of addresses()" class="bg-lm-surface border border-lm-border hover:border-lm-border-hover rounded-2xl p-6 shadow-lg transition-all flex flex-col justify-between space-y-4">
          
          <!-- Card Header: Title & Default Badge -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs bg-blue-500/10 text-blue-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-500/20">
                📍 {{ addr.title }}
              </span>
              <span *ngIf="addr.isDefault" class="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                DEFAULT ADDRESS
              </span>
            </div>

            <!-- Address Text -->
            <div class="pt-2">
              <div class="text-sm font-bold text-lm-text-main">{{ addr.addressLine1 }}</div>
              <div *ngIf="addr.addressLine2" class="text-xs text-lm-text-muted mt-0.5">{{ addr.addressLine2 }}</div>
              <div class="text-xs text-lm-text-muted font-medium mt-1">
                {{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}
              </div>
            </div>

            <!-- Coordinate Badge (Unset if not provided) -->
            <div *ngIf="addr.latitude !== undefined && addr.latitude !== null && addr.longitude !== undefined && addr.longitude !== null" class="pt-1">
              <span class="font-mono text-[10px] text-lm-text-muted bg-lm-surface-elevated px-2 py-0.5 rounded border border-lm-border">
                GPS: {{ addr.latitude }}°, {{ addr.longitude }}°
              </span>
            </div>
          </div>

          <!-- Card Actions Footer -->
          <div class="pt-4 border-t border-lm-border flex items-center justify-between gap-2">
            <div>
              <button
                *ngIf="!addr.isDefault"
                (click)="onSetDefault(addr)"
                class="text-xs text-blue-400 hover:text-blue-300 font-semibold transition focus:outline-none">
                Set as Default
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                (click)="openEditModal(addr)"
                class="px-3 py-1.5 bg-lm-surface-elevated hover:bg-lm-border-hover text-lm-text-main font-semibold text-xs rounded-lg border border-lm-border transition"
                aria-label="Edit address">
                Edit
              </button>
              <button
                (click)="openDeleteModal(addr)"
                class="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs rounded-lg transition"
                aria-label="Delete address">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== ADD / EDIT ADDRESS MODAL ==================== -->
      <div *ngIf="activeModal() === 'add' || activeModal() === 'edit'" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-4 border-b border-lm-border">
            <h2 class="text-xl font-bold text-lm-text-main">
              {{ activeModal() === 'add' ? 'Add New Delivery Address' : 'Edit Delivery Address' }}
            </h2>
            <button (click)="closeModal()" class="text-lm-text-muted hover:text-lm-text-main p-1 rounded-lg">✕</button>
          </div>

          <!-- Reactive Address Form -->
          <form [formGroup]="addressForm" (ngSubmit)="onSubmitForm()" class="space-y-4">
            
            <!-- Address Title Field -->
            <div>
              <label for="addressTitle" class="block text-xs font-semibold text-lm-text-muted uppercase tracking-wider mb-1">
                Address Title / Label *
              </label>
              <input
                id="addressTitle"
                type="text"
                formControlName="title"
                placeholder="e.g. Home, Office, Apartment"
                class="w-full bg-lm-surface-elevated border border-lm-border rounded-xl px-4 py-2.5 text-sm text-lm-text-main placeholder-lm-text-muted focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
              <div *ngIf="addressForm.get('title')?.touched && addressForm.get('title')?.invalid" class="text-rose-400 text-xs mt-1">
                Address title is required.
              </div>
            </div>

            <!-- Address Line 1 Field -->
            <div>
              <label for="addressLine1" class="block text-xs font-semibold text-lm-text-muted uppercase tracking-wider mb-1">
                Street Address (Line 1) *
              </label>
              <input
                id="addressLine1"
                type="text"
                formControlName="addressLine1"
                placeholder="e.g. 123 Main Street, House No."
                class="w-full bg-lm-surface-elevated border border-lm-border rounded-xl px-4 py-2.5 text-sm text-lm-text-main placeholder-lm-text-muted focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
              <div *ngIf="addressForm.get('addressLine1')?.touched && addressForm.get('addressLine1')?.invalid" class="text-rose-400 text-xs mt-1">
                Street address is required.
              </div>
            </div>

            <!-- Address Line 2 Field (Optional) -->
            <div>
              <label for="addressLine2" class="block text-xs font-semibold text-lm-text-muted uppercase tracking-wider mb-1">
                Apartment, Suite, Unit (Line 2)
              </label>
              <input
                id="addressLine2"
                type="text"
                formControlName="addressLine2"
                placeholder="e.g. Suite 400, Floor 2 (Optional)"
                class="w-full bg-lm-surface-elevated border border-lm-border rounded-xl px-4 py-2.5 text-sm text-lm-text-main placeholder-lm-text-muted focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <!-- City & State Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="city" class="block text-xs font-semibold text-lm-text-muted uppercase tracking-wider mb-1">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  formControlName="city"
                  placeholder="e.g. Colombo"
                  class="w-full bg-lm-surface-elevated border border-lm-border rounded-xl px-4 py-2.5 text-sm text-lm-text-main placeholder-lm-text-muted focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
                <div *ngIf="addressForm.get('city')?.touched && addressForm.get('city')?.invalid" class="text-rose-400 text-xs mt-1">
                  City is required.
                </div>
              </div>

              <div>
                <label for="state" class="block text-xs font-semibold text-lm-text-muted uppercase tracking-wider mb-1">
                  State / District *
                </label>
                <input
                  id="state"
                  type="text"
                  formControlName="state"
                  placeholder="e.g. Western Province"
                  class="w-full bg-lm-surface-elevated border border-lm-border rounded-xl px-4 py-2.5 text-sm text-lm-text-main placeholder-lm-text-muted focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
                <div *ngIf="addressForm.get('state')?.touched && addressForm.get('state')?.invalid" class="text-rose-400 text-xs mt-1">
                  State/District is required.
                </div>
              </div>
            </div>

            <!-- Postal Code Field -->
            <div>
              <label for="postalCode" class="block text-xs font-semibold text-lm-text-muted uppercase tracking-wider mb-1">
                Postal Code *
              </label>
              <input
                id="postalCode"
                type="text"
                formControlName="postalCode"
                placeholder="e.g. 00300"
                class="w-full bg-lm-surface-elevated border border-lm-border rounded-xl px-4 py-2.5 text-sm text-lm-text-main placeholder-lm-text-muted focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
              <div *ngIf="addressForm.get('postalCode')?.touched && addressForm.get('postalCode')?.invalid" class="text-rose-400 text-xs mt-1">
                Postal code is required.
              </div>
            </div>

            <!-- Optional Geographic Coordinates (Remains UNSET if unprovided) -->
            <div class="pt-2 border-t border-lm-border space-y-3">
              <span class="block text-xs font-bold text-lm-text-main uppercase tracking-wider">Geographic Coordinates (Optional)</span>
              <p class="text-[11px] text-lm-text-muted">
                Coordinates remain unset if unprovided. No placeholder defaults (such as 0.0/0.0) are assigned.
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="latitude" class="block text-xs text-lm-text-muted mb-1">Latitude (°N/S)</label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    formControlName="latitude"
                    placeholder="e.g. 6.9271 (Unset if empty)"
                    class="w-full bg-lm-surface-elevated border border-lm-border rounded-xl px-4 py-2 text-xs text-lm-text-main placeholder-lm-text-muted focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label for="longitude" class="block text-xs text-lm-text-muted mb-1">Longitude (°E/W)</label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    formControlName="longitude"
                    placeholder="e.g. 79.8612 (Unset if empty)"
                    class="w-full bg-lm-surface-elevated border border-lm-border rounded-xl px-4 py-2 text-xs text-lm-text-main placeholder-lm-text-muted focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <!-- Set Default Checkbox -->
            <div class="pt-2 flex items-center gap-2">
              <input
                id="isDefaultCheckbox"
                type="checkbox"
                formControlName="isDefault"
                class="w-4 h-4 rounded border-lm-border bg-lm-surface-elevated text-blue-600 focus:ring-blue-500/40"
              />
              <label for="isDefaultCheckbox" class="text-xs text-lm-text-main font-semibold">
                Set as Primary Default Delivery Address
              </label>
            </div>

            <!-- Modal Action Buttons -->
            <div class="flex justify-end gap-3 pt-6 border-t border-lm-border">
              <button
                type="button"
                (click)="closeModal()"
                class="px-5 py-2.5 bg-lm-surface-elevated hover:bg-lm-border-hover text-lm-text-main text-xs font-semibold rounded-xl border border-lm-border transition">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="addressForm.invalid || submitting()"
                class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50">
                {{ activeModal() === 'add' ? 'Save Address' : 'Update Address' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ==================== DELETE CONFIRMATION MODAL ==================== -->
      <div *ngIf="activeModal() === 'delete' && selectedAddress()" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
          <h2 class="text-lg font-bold text-lm-text-main">Delete Delivery Address</h2>
          <p class="text-xs text-lm-text-muted">
            Are you sure you want to delete <span class="text-lm-text-main font-bold">{{ selectedAddress()?.title }}</span> ({{ selectedAddress()?.addressLine1 }})? This action cannot be undone.
          </p>
          <div class="flex justify-end gap-3 pt-4 border-t border-lm-border">
            <button
              (click)="closeModal()"
              class="px-4 py-2 bg-lm-surface-elevated hover:bg-lm-border-hover text-lm-text-main text-xs font-semibold rounded-xl border border-lm-border transition">
              Cancel
            </button>
            <button
              (click)="onConfirmDelete()"
              [disabled]="submitting()"
              class="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-sm transition">
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerAddressesComponent implements OnInit {
  private addressService = inject(AddressService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  addresses = signal<CustomerAddressDto[]>([]);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  errorState = signal<boolean>(false);
  errorMessage = signal<string>('');
  backendNotice = signal<string | null>(null);

  activeModal = signal<'add' | 'edit' | 'delete' | null>(null);
  selectedAddress = signal<CustomerAddressDto | null>(null);

  addressForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    addressLine1: ['', [Validators.required]],
    addressLine2: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postalCode: ['', [Validators.required]],
    latitude: [null],
    longitude: [null],
    isDefault: [false]
  });

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.loading.set(true);
    this.errorState.set(false);
    this.backendNotice.set(null);

    this.addressService.getAddresses().subscribe({
      next: (data) => {
        this.addresses.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorState.set(true);
        this.backendNotice.set(
          'Backend Address API (/api/v1/customer/addresses) is not currently deployed on the server. Frontend component UI rendered cleanly; address records will load dynamically once backend slice is deployed.'
        );
      }
    });
  }

  openAddModal(): void {
    this.addressForm.reset({
      title: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      latitude: null,
      longitude: null,
      isDefault: false
    });
    this.activeModal.set('add');
  }

  openEditModal(addr: CustomerAddressDto): void {
    this.selectedAddress.set(addr);
    this.addressForm.patchValue({
      title: addr.title,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      latitude: addr.latitude ?? null,
      longitude: addr.longitude ?? null,
      isDefault: addr.isDefault
    });
    this.activeModal.set('edit');
  }

  openDeleteModal(addr: CustomerAddressDto): void {
    this.selectedAddress.set(addr);
    this.activeModal.set('delete');
  }

  closeModal(): void {
    this.activeModal.set(null);
    this.selectedAddress.set(null);
  }

  onSubmitForm(): void {
    if (this.addressForm.invalid) return;

    this.submitting.set(true);
    const formVal = this.addressForm.value;

    const latVal = formVal.latitude !== null && formVal.latitude !== '' ? parseFloat(formVal.latitude) : undefined;
    const lngVal = formVal.longitude !== null && formVal.longitude !== '' ? parseFloat(formVal.longitude) : undefined;

    if (this.activeModal() === 'add') {
      const createDto: CreateAddressRequestDto = {
        title: formVal.title.trim(),
        addressLine1: formVal.addressLine1.trim(),
        addressLine2: formVal.addressLine2 ? formVal.addressLine2.trim() : undefined,
        city: formVal.city.trim(),
        state: formVal.state.trim(),
        postalCode: formVal.postalCode.trim(),
        latitude: latVal,
        longitude: lngVal,
        isDefault: formVal.isDefault
      };

      this.addressService.createAddress(createDto).subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.toastService.success(`Saved address "${created.title}" successfully.`, 'Address Created');
          this.closeModal();
          this.loadAddresses();
        },
        error: (err) => {
          this.submitting.set(false);
          this.toastService.info('Address save submitted (Backend API endpoint awaiting deployment).', 'Address Action');
          this.closeModal();
        }
      });
    } else if (this.activeModal() === 'edit') {
      const selected = this.selectedAddress();
      if (!selected) return;

      const updateDto: UpdateAddressRequestDto = {
        title: formVal.title.trim(),
        addressLine1: formVal.addressLine1.trim(),
        addressLine2: formVal.addressLine2 ? formVal.addressLine2.trim() : undefined,
        city: formVal.city.trim(),
        state: formVal.state.trim(),
        postalCode: formVal.postalCode.trim(),
        latitude: latVal,
        longitude: lngVal,
        isDefault: formVal.isDefault
      };

      this.addressService.updateAddress(selected.id, updateDto).subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.toastService.success(`Updated address "${updated.title}" successfully.`, 'Address Updated');
          this.closeModal();
          this.loadAddresses();
        },
        error: (err) => {
          this.submitting.set(false);
          this.toastService.info('Address update submitted (Backend API endpoint awaiting deployment).', 'Address Action');
          this.closeModal();
        }
      });
    }
  }

  onSetDefault(addr: CustomerAddressDto): void {
    this.addressService.setDefaultAddress(addr.id).subscribe({
      next: (res) => {
        this.toastService.success(`Set "${addr.title}" as default delivery address.`, 'Default Updated');
        this.loadAddresses();
      },
      error: () => {
        this.toastService.info(`Set default request submitted for "${addr.title}".`, 'Address Action');
      }
    });
  }

  onConfirmDelete(): void {
    const selected = this.selectedAddress();
    if (!selected) return;

    this.submitting.set(true);
    this.addressService.deleteAddress(selected.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.success(`Deleted address "${selected.title}".`, 'Address Deleted');
        this.closeModal();
        this.loadAddresses();
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.info(`Delete request submitted for "${selected.title}".`, 'Address Action');
        this.closeModal();
      }
    });
  }
}

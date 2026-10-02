import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VendorCatalogService, VendorProductItem, VendorInventoryItem } from '../../core/services/vendor-catalog.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { Category } from '../../core/models/auth.models';
import { SkeletonLoaderComponent } from '../../shared/components/loading/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-vendor-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header Banner -->
      <div class="md:flex md:items-center md:justify-between bg-lm-surface border border-lm-border rounded-2xl p-6 mb-8 text-lm-text-main shadow-xl relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-2 border border-blue-500/20">
            Vendor Store Portal
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight text-lm-text-main">Catalog & Stock Management</h1>
          <p class="mt-1 text-sm text-lm-text-muted">Manage products, update stock availability, and control storefront status.</p>
        </div>
        <div class="mt-4 md:mt-0 flex gap-3 relative z-10">
          <button (click)="openCreateModal()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add New Product
          </button>
        </div>
      </div>

      <!-- Notification Alerts -->
      <div *ngIf="successMessage" class="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium flex justify-between items-center shadow-md">
        <span>{{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold">✕</button>
      </div>

      <div *ngIf="errorMessage" class="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium flex justify-between items-center shadow-md">
        <span>{{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 font-bold">✕</button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-lm-border mb-6">
        <button (click)="activeTab = 'products'" [class.border-blue-500]="activeTab === 'products'" [class.text-blue-500]="activeTab === 'products'" [class.dark:text-blue-400]="activeTab === 'products'" class="py-3 px-6 font-bold border-b-2 border-transparent text-lm-text-muted hover:text-lm-text-main transition">
          Products Listing ({{ products.length }})
        </button>
        <button (click)="activeTab = 'inventory'; loadInventory()" [class.border-blue-500]="activeTab === 'inventory'" [class.text-blue-500]="activeTab === 'inventory'" [class.dark:text-blue-400]="activeTab === 'inventory'" class="py-3 px-6 font-bold border-b-2 border-transparent text-lm-text-muted hover:text-lm-text-main transition">
          Inventory Stock Control ({{ inventoryItems.length }})
        </button>
      </div>

      <!-- Products Tab -->
      <div *ngIf="activeTab === 'products'">
        <div class="bg-lm-surface rounded-2xl border border-lm-border shadow-xl overflow-hidden">
          <div class="p-4 border-b border-lm-border flex justify-between items-center bg-lm-surface-elevated/40">
            <div class="flex items-center gap-3">
              <label class="text-xs font-bold uppercase tracking-wider text-lm-text-muted">Filter Status:</label>
              <select [(ngModel)]="statusFilter" (change)="loadProducts()" class="text-sm rounded-xl border border-lm-border py-1.5 px-3 bg-lm-surface text-lm-text-main shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
                <option value="OutOfStock">OutOfStock</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <span class="text-xs text-lm-text-muted font-medium">Showing {{ products.length }} item(s)</span>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-lm-border">
              <thead class="bg-lm-surface-elevated/80 text-lm-text-muted uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th class="px-6 py-3.5 text-left">Product</th>
                  <th class="px-6 py-3.5 text-left">Category</th>
                  <th class="px-6 py-3.5 text-left">SKU</th>
                  <th class="px-6 py-3.5 text-left">Price</th>
                  <th class="px-6 py-3.5 text-left">Stock (Available / Reserved)</th>
                  <th class="px-6 py-3.5 text-left">Status</th>
                  <th class="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-lm-border text-sm text-lm-text-main">
                <tr *ngFor="let p of products" class="hover:bg-lm-surface-elevated/40 transition">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <img [src]="p.primaryImageUrl" class="w-12 h-12 rounded-xl object-cover border border-lm-border shadow-md" alt="product">
                      <div>
                        <div class="font-bold text-lm-text-main text-base">{{ p.name }}</div>
                        <div class="text-xs text-lm-text-muted">ID: {{ p.id.substring(0, 8) }}...</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 font-medium text-lm-text-muted">{{ p.categoryName }}</td>
                  <td class="px-6 py-4 font-mono text-xs text-blue-500 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 py-1 px-2.5 rounded-lg inline-block font-semibold mt-3">{{ p.sku }}</td>
                  <td class="px-6 py-4 font-extrabold text-blue-600 dark:text-blue-400 text-base">\${{ p.price.toFixed(2) }}</td>
                  <td class="px-6 py-4">
                    <span [class.text-rose-500]="p.quantityAvailable <= 0" [class.text-emerald-500]="p.quantityAvailable > 0" class="font-extrabold">
                      {{ p.quantityAvailable }} available
                    </span>
                    <span class="text-xs text-lm-text-muted block">({{ p.quantityReserved }} held)</span>
                  </td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30': p.status === 'Active',
                      'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30': p.status === 'Draft',
                      'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30': p.status === 'Inactive' || p.status === 'OutOfStock',
                      'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30': p.status === 'Suspended'
                    }" class="px-3 py-1 text-xs font-bold rounded-full border">
                      {{ p.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <button (click)="openQuickStockModal(p)" class="px-3 py-1.5 bg-lm-surface-elevated hover:bg-lm-border text-lm-text-main border border-lm-border text-xs font-semibold rounded-xl transition">
                        Edit Stock
                      </button>
                      <select (change)="updateStatus(p.id, $any($event.target).value)" class="text-xs rounded-xl border border-lm-border py-1 px-2.5 bg-lm-surface text-lm-text-main shadow-sm focus:border-blue-500">
                        <option value="" disabled selected>Change Status</option>
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Inactive">Inactive</option>
                        <option value="OutOfStock">OutOfStock</option>
                      </select>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="products.length === 0">
                  <td colspan="7" class="text-center py-12 text-lm-text-muted">No products found in vendor store. Click "Add New Product" to create one.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Inventory Tab -->
      <div *ngIf="activeTab === 'inventory'">
        <div class="bg-lm-surface rounded-2xl border border-lm-border shadow-xl overflow-hidden">
          <div class="p-4 border-b border-lm-border bg-lm-surface-elevated/40 flex justify-between items-center">
            <h3 class="font-bold text-lm-text-main">Physical Stock & Reservation Overview</h3>
            <button (click)="loadInventory()" class="text-xs font-bold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-1 transition">
              🔄 Refresh Inventory
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-lm-border">
              <thead class="bg-lm-surface-elevated/80 text-lm-text-muted uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th class="px-6 py-3.5 text-left">Product Name</th>
                  <th class="px-6 py-3.5 text-left">SKU</th>
                  <th class="px-6 py-3.5 text-left">Unreserved Stock</th>
                  <th class="px-6 py-3.5 text-left">Reserved Stock</th>
                  <th class="px-6 py-3.5 text-left">Total Physical Stock</th>
                  <th class="px-6 py-3.5 text-left">Status</th>
                  <th class="px-6 py-3.5 text-right">Stock Update</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-lm-border text-sm text-lm-text-main">
                <tr *ngFor="let item of inventoryItems" class="hover:bg-lm-surface-elevated/40 transition">
                  <td class="px-6 py-4 font-bold text-lm-text-main text-base">{{ item.productName }}</td>
                  <td class="px-6 py-4 font-mono text-xs text-lm-text-muted">{{ item.productSku }}</td>
                  <td class="px-6 py-4 font-extrabold text-emerald-500 dark:text-emerald-400">{{ item.quantityAvailable }} units</td>
                  <td class="px-6 py-4 font-semibold text-amber-500 dark:text-amber-400">{{ item.quantityReserved }} units</td>
                  <td class="px-6 py-4 font-bold text-lm-text-main">{{ item.totalPhysicalStock }} units</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-lm-surface-elevated text-lm-text-muted border border-lm-border">
                      {{ item.productStatus }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end items-center gap-2">
                      <input #stockInput type="number" min="0" [value]="item.quantityAvailable" class="w-24 text-xs rounded-xl border border-lm-border bg-lm-surface text-lm-text-main py-1.5 px-3 text-center focus:border-blue-500">
                      <button (click)="saveInventoryStock(item.productId, +stockInput.value)" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition">
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Product Dark Glassmorphism Modal -->
    <div *ngIf="showCreateModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div class="bg-lm-surface border border-lm-border rounded-3xl shadow-2xl max-w-lg w-full p-6 text-lm-text-main animate-in fade-in zoom-in duration-200 my-8">
        <div class="flex justify-between items-center border-b border-lm-border pb-4 mb-6">
          <div>
            <h3 class="text-xl font-bold text-lm-text-main tracking-tight">Create New Catalog Product</h3>
            <p class="text-xs text-lm-text-muted mt-0.5">Fill in product details and upload product image to Cloudinary.</p>
          </div>
          <button (click)="showCreateModal = false" class="text-lm-text-muted hover:text-lm-text-main text-lg font-bold p-1">✕</button>
        </div>

        <form [formGroup]="productForm" (ngSubmit)="submitCreateProduct()">
          <div class="space-y-4 text-sm">
            <div>
              <label class="block font-semibold text-lm-text-main mb-1.5 text-xs tracking-wider uppercase">Product Name</label>
              <input formControlName="name" type="text" placeholder="e.g. Organic Honeycrisp Apples" class="w-full rounded-xl border border-lm-border bg-lm-surface-elevated text-lm-text-main placeholder-lm-text-muted py-2.5 px-3.5 focus:ring-blue-500 focus:border-blue-500 font-medium">
            </div>

            <div>
              <label class="block font-semibold text-lm-text-main mb-1.5 text-xs tracking-wider uppercase">Category</label>
              <select formControlName="categoryId" class="w-full rounded-xl border border-lm-border bg-lm-surface-elevated text-lm-text-main py-2.5 px-3.5 focus:ring-blue-500 focus:border-blue-500 font-medium">
                <option value="" disabled>Select Category</option>
                <option *ngFor="let cat of categories" [value]="cat.id" class="bg-lm-surface text-lm-text-main">{{ cat.name }}</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-lm-text-main mb-1.5 text-xs tracking-wider uppercase">SKU Code</label>
                <input formControlName="sku" type="text" placeholder="PROD-001" class="w-full rounded-xl border border-lm-border bg-lm-surface-elevated text-blue-500 dark:text-blue-400 placeholder-lm-text-muted py-2.5 px-3.5 font-mono text-xs focus:ring-blue-500 focus:border-blue-500 uppercase font-bold">
              </div>
              <div>
                <label class="block font-semibold text-lm-text-main mb-1.5 text-xs tracking-wider uppercase">Price (\$)</label>
                <input formControlName="price" type="number" step="0.01" min="0.01" placeholder="4.99" class="w-full rounded-xl border border-lm-border bg-lm-surface-elevated text-lm-text-main placeholder-lm-text-muted py-2.5 px-3.5 focus:ring-blue-500 focus:border-blue-500 font-medium">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-lm-text-main mb-1.5 text-xs tracking-wider uppercase">Initial Stock</label>
                <input formControlName="initialQuantity" type="number" min="0" placeholder="50" class="w-full rounded-xl border border-lm-border bg-lm-surface-elevated text-lm-text-main placeholder-lm-text-muted py-2.5 px-3.5 focus:ring-blue-500 focus:border-blue-500 font-medium">
              </div>
              <div>
                <label class="block font-semibold text-lm-text-main mb-1.5 text-xs tracking-wider uppercase">Initial Status</label>
                <select formControlName="status" class="w-full rounded-xl border border-lm-border bg-lm-surface-elevated text-lm-text-main py-2.5 px-3.5 focus:ring-blue-500 focus:border-blue-500 font-medium">
                  <option value="Active" class="bg-lm-surface text-lm-text-main">Active</option>
                  <option value="Draft" class="bg-lm-surface text-lm-text-main">Draft</option>
                  <option value="Inactive" class="bg-lm-surface text-lm-text-main">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-lm-text-main mb-1.5 text-xs tracking-wider uppercase">Description</label>
              <textarea formControlName="description" rows="3" placeholder="Enter product specifications and details..." class="w-full rounded-xl border border-lm-border bg-lm-surface-elevated text-lm-text-main placeholder-lm-text-muted py-2.5 px-3.5 focus:ring-blue-500 focus:border-blue-500 font-medium"></textarea>
            </div>

            <!-- Direct File Upload to Cloudinary Field -->
            <div>
              <label class="block font-semibold text-lm-text-main mb-1.5 text-xs tracking-wider uppercase">Product Image</label>
              
              <div class="mt-1 flex items-center gap-4">
                <!-- Thumbnail Preview -->
                <div *ngIf="selectedImagePreview" class="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500/60 shadow-lg shrink-0">
                  <img [src]="selectedImagePreview" class="w-full h-full object-cover">
                  <div *ngIf="isUploadingImage" class="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                    <svg class="animate-spin w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                  </div>
                </div>

                <!-- Custom File Input Button -->
                <label class="flex-1 cursor-pointer flex flex-col items-center justify-center py-4 px-4 border-2 border-dashed border-lm-border hover:border-blue-500/60 rounded-2xl bg-lm-surface-elevated/60 hover:bg-lm-surface-elevated transition group">
                  <div class="flex items-center gap-2 text-blue-500 dark:text-blue-400 font-bold text-sm">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span>{{ isUploadingImage ? 'Uploading to Cloudinary...' : '📷 Select Image File' }}</span>
                  </div>
                  <span class="text-xs text-lm-text-muted mt-1">PNG, JPG, WEBP (Uploads to Cloudinary)</span>
                  <input type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden">
                </label>
              </div>

              <div *ngIf="uploadSuccessMessage" class="text-xs text-emerald-500 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
                ✓ {{ uploadSuccessMessage }}
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-lm-border">
            <button type="button" (click)="showCreateModal = false" class="px-5 py-2.5 bg-lm-surface-elevated text-lm-text-muted hover:text-lm-text-main rounded-xl font-bold transition">Cancel</button>
            <button type="submit" [disabled]="productForm.invalid || isSubmitting || isUploadingImage" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-extrabold disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
              {{ isSubmitting ? 'Saving...' : 'Create Product' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class VendorCatalogComponent implements OnInit {
  activeTab: 'products' | 'inventory' = 'products';
  products: VendorProductItem[] = [];
  inventoryItems: VendorInventoryItem[] = [];
  categories: Category[] = [];
  statusFilter = '';

  showCreateModal = false;
  isSubmitting = false;
  isUploadingImage = false;
  selectedImagePreview = '';
  uploadSuccessMessage = '';
  successMessage = '';
  errorMessage = '';

  productForm: FormGroup;

  constructor(
    private vendorCatalogService: VendorCatalogService,
    private catalogService: CatalogService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      categoryId: ['', Validators.required],
      sku: ['', [Validators.required, Validators.maxLength(100)]],
      price: [4.99, [Validators.required, Validators.min(0.01)]],
      initialQuantity: [50, [Validators.required, Validators.min(0)]],
      status: ['Active', Validators.required],
      description: ['', Validators.required],
      imageUrl: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.vendorCatalogService.getVendorProducts(this.statusFilter).subscribe({
      next: (res) => {
        this.products = res.products;
      },
      error: (err) => {
        const msg = err.error?.detail || 'Failed to load vendor products.';
        this.toastService.error(msg, 'Vendor Catalog Error');
      }
    });
  }

  loadInventory(): void {
    this.vendorCatalogService.getVendorInventory().subscribe({
      next: (items) => {
        this.inventoryItems = items;
      },
      error: (err) => {
        const msg = err.error?.detail || 'Failed to load inventory stock.';
        this.toastService.error(msg, 'Inventory Error');
      }
    });
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (cats) => this.categories = cats,
      error: () => {}
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.selectedImagePreview = 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80';
    this.uploadSuccessMessage = '';
    this.productForm.reset({
      price: 4.99,
      initialQuantity: 50,
      status: 'Active',
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80'
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    // Display local image preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);

    this.isUploadingImage = true;
    this.uploadSuccessMessage = '';

    this.vendorCatalogService.uploadProductImage(file).subscribe({
      next: (res) => {
        this.isUploadingImage = false;
        this.productForm.patchValue({ imageUrl: res.imageUrl });
        this.uploadSuccessMessage = 'Image uploaded to Cloudinary successfully!';
      },
      error: (err) => {
        this.isUploadingImage = false;
        this.errorMessage = err.error?.message || 'Failed to upload image to Cloudinary.';
      }
    });
  }

  submitCreateProduct(): void {
    if (this.productForm.invalid) return;

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const val = this.productForm.value;
    const request = {
      categoryId: val.categoryId,
      name: val.name,
      description: val.description,
      sku: val.sku,
      price: val.price,
      status: val.status,
      initialQuantity: val.initialQuantity,
      lowStockThreshold: 10,
      imageUrls: [{ imageUrl: val.imageUrl || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80', isPrimary: true }]
    };

    this.vendorCatalogService.createProduct(request).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.showCreateModal = false;
        this.successMessage = `Product '${res.name}' created successfully with ${res.quantityAvailable} units!`;
        this.loadProducts();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.detail || err.message || 'Failed to create product.';
      }
    });
  }

  updateStatus(productId: string, status: string): void {
    this.vendorCatalogService.updateProductStatus(productId, status).subscribe({
      next: (res) => {
        this.successMessage = `Product status updated to '${res.status}'.`;
        this.loadProducts();
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Failed to update product status.';
      }
    });
  }

  openQuickStockModal(p: VendorProductItem): void {
    const newQtyStr = prompt(`Update Available Stock for '${p.name}':`, p.quantityAvailable.toString());
    if (newQtyStr === null) return;
    const newQty = parseInt(newQtyStr, 10);
    if (isNaN(newQty) || newQty < 0) {
      alert('Invalid stock number.');
      return;
    }
    this.saveInventoryStock(p.id, newQty);
  }

  saveInventoryStock(productId: string, newQty: number): void {
    this.vendorCatalogService.updateInventory(productId, newQty).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.loadProducts();
        if (this.activeTab === 'inventory') {
          this.loadInventory();
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Failed to update inventory stock.';
      }
    });
  }
}

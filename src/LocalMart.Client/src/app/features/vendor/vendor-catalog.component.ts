import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VendorCatalogService, VendorProductItem, VendorInventoryItem } from '../../core/services/vendor-catalog.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Category } from '../../core/models/auth.models';

@Component({
  selector: 'app-vendor-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header Banner -->
      <div class="md:flex md:items-center md:justify-between bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 mb-8 text-white shadow-xl">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-200 mb-2 border border-emerald-400/30">
            Vendor Store Portal
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight">Catalog & Stock Management</h1>
          <p class="mt-1 text-sm text-emerald-100/80">Manage products, update stock availability, and control storefront status.</p>
        </div>
        <div class="mt-4 md:mt-0 flex gap-3">
          <button (click)="openCreateModal()" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add New Product
          </button>
        </div>
      </div>

      <!-- Notification Alerts -->
      <div *ngIf="successMessage" class="mb-6 p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-medium flex justify-between items-center shadow-lg">
        <span>{{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-400 hover:text-emerald-200 font-bold">✕</button>
      </div>

      <div *ngIf="errorMessage" class="mb-6 p-4 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-xl text-sm font-medium flex justify-between items-center shadow-lg">
        <span>{{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-400 hover:text-rose-200 font-bold">✕</button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-slate-800 mb-6">
        <button (click)="activeTab = 'products'" [class.border-emerald-500]="activeTab === 'products'" [class.text-emerald-400]="activeTab === 'products'" class="py-3 px-6 font-bold border-b-2 border-transparent text-slate-400 hover:text-emerald-400 transition">
          Products Listing ({{ products.length }})
        </button>
        <button (click)="activeTab = 'inventory'; loadInventory()" [class.border-emerald-500]="activeTab === 'inventory'" [class.text-emerald-400]="activeTab === 'inventory'" class="py-3 px-6 font-bold border-b-2 border-transparent text-slate-400 hover:text-emerald-400 transition">
          Inventory Stock Control ({{ inventoryItems.length }})
        </button>
      </div>

      <!-- Products Tab -->
      <div *ngIf="activeTab === 'products'">
        <div class="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
          <div class="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div class="flex items-center gap-3">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-400">Filter Status:</label>
              <select [(ngModel)]="statusFilter" (change)="loadProducts()" class="text-sm rounded-xl border-slate-700 py-1.5 px-3 bg-slate-800 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
                <option value="OutOfStock">OutOfStock</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <span class="text-xs text-slate-400 font-medium">Showing {{ products.length }} item(s)</span>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-800">
              <thead class="bg-slate-950/60 text-slate-400 uppercase text-xs font-semibold tracking-wider">
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
              <tbody class="divide-y divide-slate-800 text-sm text-slate-200">
                <tr *ngFor="let p of products" class="hover:bg-slate-800/60 transition">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <img [src]="p.primaryImageUrl" class="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md" alt="product">
                      <div>
                        <div class="font-bold text-white text-base">{{ p.name }}</div>
                        <div class="text-xs text-slate-400">ID: {{ p.id.substring(0, 8) }}...</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 font-medium text-slate-300">{{ p.categoryName }}</td>
                  <td class="px-6 py-4 font-mono text-xs text-emerald-300 bg-slate-800 border border-slate-700 py-1 px-2.5 rounded-lg inline-block font-semibold mt-3">{{ p.sku }}</td>
                  <td class="px-6 py-4 font-extrabold text-emerald-400 text-base">\${{ p.price.toFixed(2) }}</td>
                  <td class="px-6 py-4">
                    <span [class.text-rose-400]="p.quantityAvailable <= 0" [class.text-emerald-400]="p.quantityAvailable > 0" class="font-extrabold">
                      {{ p.quantityAvailable }} available
                    </span>
                    <span class="text-xs text-slate-400 block">({{ p.quantityReserved }} held)</span>
                  </td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-emerald-500/20 text-emerald-300 border-emerald-500/40': p.status === 'Active',
                      'bg-slate-800 text-slate-300 border-slate-700': p.status === 'Draft',
                      'bg-amber-500/20 text-amber-300 border-amber-500/40': p.status === 'Inactive' || p.status === 'OutOfStock',
                      'bg-rose-500/20 text-rose-300 border-rose-500/40': p.status === 'Suspended'
                    }" class="px-3 py-1 text-xs font-bold rounded-full border">
                      {{ p.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <button (click)="openQuickStockModal(p)" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition">
                        Edit Stock
                      </button>
                      <select (change)="updateStatus(p.id, $any($event.target).value)" class="text-xs rounded-xl border-slate-700 py-1 px-2.5 bg-slate-800 text-slate-200 shadow-sm focus:border-emerald-500">
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
                  <td colspan="7" class="text-center py-12 text-slate-400">No products found in vendor store. Click "Add New Product" to create one.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Inventory Tab -->
      <div *ngIf="activeTab === 'inventory'">
        <div class="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
          <div class="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h3 class="font-bold text-white">Physical Stock & Reservation Overview</h3>
            <button (click)="loadInventory()" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              🔄 Refresh Inventory
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-800">
              <thead class="bg-slate-950/60 text-slate-400 uppercase text-xs font-semibold tracking-wider">
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
              <tbody class="divide-y divide-slate-800 text-sm text-slate-200">
                <tr *ngFor="let item of inventoryItems" class="hover:bg-slate-800/60 transition">
                  <td class="px-6 py-4 font-bold text-white text-base">{{ item.productName }}</td>
                  <td class="px-6 py-4 font-mono text-xs text-slate-400">{{ item.productSku }}</td>
                  <td class="px-6 py-4 font-extrabold text-emerald-400">{{ item.quantityAvailable }} units</td>
                  <td class="px-6 py-4 font-semibold text-amber-400">{{ item.quantityReserved }} units</td>
                  <td class="px-6 py-4 font-bold text-white">{{ item.totalPhysicalStock }} units</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {{ item.productStatus }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end items-center gap-2">
                      <input #stockInput type="number" min="0" [value]="item.quantityAvailable" class="w-24 text-xs rounded-xl border-slate-700 bg-slate-800 text-white py-1.5 px-3 text-center focus:border-emerald-500">
                      <button (click)="saveInventoryStock(item.productId, +stockInput.value)" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition">
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
      <div class="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 text-white animate-in fade-in zoom-in duration-200 my-8">
        <div class="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
          <div>
            <h3 class="text-xl font-bold text-white tracking-tight">Create New Catalog Product</h3>
            <p class="text-xs text-slate-400 mt-0.5">Fill in product details and upload product image to Cloudinary.</p>
          </div>
          <button (click)="showCreateModal = false" class="text-slate-400 hover:text-white text-lg font-bold p-1">✕</button>
        </div>

        <form [formGroup]="productForm" (ngSubmit)="submitCreateProduct()">
          <div class="space-y-4 text-sm">
            <div>
              <label class="block font-semibold text-slate-200 mb-1.5 text-xs tracking-wider uppercase">Product Name</label>
              <input formControlName="name" type="text" placeholder="e.g. Organic Honeycrisp Apples" class="w-full rounded-xl border-slate-700 bg-slate-800 text-white placeholder-slate-400 py-2.5 px-3.5 focus:ring-emerald-500 focus:border-emerald-500 font-medium">
            </div>

            <div>
              <label class="block font-semibold text-slate-200 mb-1.5 text-xs tracking-wider uppercase">Category</label>
              <select formControlName="categoryId" class="w-full rounded-xl border-slate-700 bg-slate-800 text-white py-2.5 px-3.5 focus:ring-emerald-500 focus:border-emerald-500 font-medium">
                <option value="" disabled>Select Category</option>
                <option *ngFor="let cat of categories" [value]="cat.id" class="bg-slate-900 text-white">{{ cat.name }}</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-200 mb-1.5 text-xs tracking-wider uppercase">SKU Code</label>
                <input formControlName="sku" type="text" placeholder="PROD-001" class="w-full rounded-xl border-slate-700 bg-slate-800 text-emerald-400 placeholder-slate-400 py-2.5 px-3.5 font-mono text-xs focus:ring-emerald-500 focus:border-emerald-500 uppercase font-bold">
              </div>
              <div>
                <label class="block font-semibold text-slate-200 mb-1.5 text-xs tracking-wider uppercase">Price (\$) </label>
                <input formControlName="price" type="number" step="0.01" min="0.01" placeholder="4.99" class="w-full rounded-xl border-slate-700 bg-slate-800 text-white placeholder-slate-400 py-2.5 px-3.5 focus:ring-emerald-500 focus:border-emerald-500 font-medium">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-200 mb-1.5 text-xs tracking-wider uppercase">Initial Stock</label>
                <input formControlName="initialQuantity" type="number" min="0" placeholder="50" class="w-full rounded-xl border-slate-700 bg-slate-800 text-white placeholder-slate-400 py-2.5 px-3.5 focus:ring-emerald-500 focus:border-emerald-500 font-medium">
              </div>
              <div>
                <label class="block font-semibold text-slate-200 mb-1.5 text-xs tracking-wider uppercase">Initial Status</label>
                <select formControlName="status" class="w-full rounded-xl border-slate-700 bg-slate-800 text-white py-2.5 px-3.5 focus:ring-emerald-500 focus:border-emerald-500 font-medium">
                  <option value="Active" class="bg-slate-900 text-white">Active</option>
                  <option value="Draft" class="bg-slate-900 text-white">Draft</option>
                  <option value="Inactive" class="bg-slate-900 text-white">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-200 mb-1.5 text-xs tracking-wider uppercase">Description</label>
              <textarea formControlName="description" rows="3" placeholder="Enter product specifications and details..." class="w-full rounded-xl border-slate-700 bg-slate-800 text-white placeholder-slate-400 py-2.5 px-3.5 focus:ring-emerald-500 focus:border-emerald-500 font-medium"></textarea>
            </div>

            <!-- Direct File Upload to Cloudinary Field -->
            <div>
              <label class="block font-semibold text-slate-200 mb-1.5 text-xs tracking-wider uppercase">Product Image</label>
              
              <div class="mt-1 flex items-center gap-4">
                <!-- Thumbnail Preview -->
                <div *ngIf="selectedImagePreview" class="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-lg shrink-0">
                  <img [src]="selectedImagePreview" class="w-full h-full object-cover">
                  <div *ngIf="isUploadingImage" class="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                    <svg class="animate-spin w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                  </div>
                </div>

                <!-- Custom File Input Button -->
                <label class="flex-1 cursor-pointer flex flex-col items-center justify-center py-4 px-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl bg-slate-800/60 hover:bg-slate-800 transition group">
                  <div class="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span>{{ isUploadingImage ? 'Uploading to Cloudinary...' : '📷 Select Image File' }}</span>
                  </div>
                  <span class="text-xs text-slate-400 mt-1">PNG, JPG, WEBP (Uploads to Cloudinary)</span>
                  <input type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden">
                </label>
              </div>

              <div *ngIf="uploadSuccessMessage" class="text-xs text-emerald-400 font-bold mt-2 flex items-center gap-1">
                ✓ {{ uploadSuccessMessage }}
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" (click)="showCreateModal = false" class="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700">Cancel</button>
            <button type="submit" [disabled]="productForm.invalid || isSubmitting || isUploadingImage" class="px-6 py-2.5 bg-emerald-500 text-slate-950 rounded-xl font-extrabold hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20">
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
        this.errorMessage = err.error?.detail || 'Failed to load vendor products.';
      }
    });
  }

  loadInventory(): void {
    this.vendorCatalogService.getVendorInventory().subscribe({
      next: (items) => {
        this.inventoryItems = items;
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Failed to load inventory stock.';
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

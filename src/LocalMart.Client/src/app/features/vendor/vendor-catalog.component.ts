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
      <div *ngIf="successMessage" class="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex justify-between items-center">
        <span>{{ successMessage }}</span>
        <button (click)="successMessage = ''" class="text-emerald-500 hover:text-emerald-700">✕</button>
      </div>

      <div *ngIf="errorMessage" class="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium flex justify-between items-center">
        <span>{{ errorMessage }}</span>
        <button (click)="errorMessage = ''" class="text-rose-500 hover:text-rose-700">✕</button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-slate-200 mb-6">
        <button (click)="activeTab = 'products'" [class.border-emerald-600]="activeTab === 'products'" [class.text-emerald-700]="activeTab === 'products'" class="py-3 px-6 font-semibold border-b-2 border-transparent text-slate-600 hover:text-emerald-600 transition">
          Products Listing ({{ products.length }})
        </button>
        <button (click)="activeTab = 'inventory'; loadInventory()" [class.border-emerald-600]="activeTab === 'inventory'" [class.text-emerald-700]="activeTab === 'inventory'" class="py-3 px-6 font-semibold border-b-2 border-transparent text-slate-600 hover:text-emerald-600 transition">
          Inventory Stock Control ({{ inventoryItems.length }})
        </button>
      </div>

      <!-- Products Tab -->
      <div *ngIf="activeTab === 'products'">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div class="flex items-center gap-3">
              <label class="text-xs font-bold uppercase text-slate-500">Filter Status:</label>
              <select [(ngModel)]="statusFilter" (change)="loadProducts()" class="text-sm rounded-lg border-slate-300 py-1.5 px-3 bg-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
                <option value="OutOfStock">OutOfStock</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <span class="text-xs text-slate-500">Showing {{ products.length }} item(s)</span>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
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
              <tbody class="divide-y divide-slate-100 text-sm">
                <tr *ngFor="let p of products" class="hover:bg-slate-50/80 transition">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <img [src]="p.primaryImageUrl" class="w-10 h-10 rounded-lg object-cover border border-slate-200" alt="product">
                      <div>
                        <div class="font-bold text-slate-900">{{ p.name }}</div>
                        <div class="text-xs text-slate-400">ID: {{ p.id.substring(0, 8) }}...</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 font-medium text-slate-700">{{ p.categoryName }}</td>
                  <td class="px-6 py-4 font-mono text-xs text-slate-600 bg-slate-100/60 py-1 px-2 rounded inline-block mt-3">{{ p.sku }}</td>
                  <td class="px-6 py-4 font-bold text-slate-900">\${{ p.price.toFixed(2) }}</td>
                  <td class="px-6 py-4">
                    <span [class.text-rose-600]="p.quantityAvailable <= 0" [class.text-emerald-700]="p.quantityAvailable > 0" class="font-bold">
                      {{ p.quantityAvailable }} available
                    </span>
                    <span class="text-xs text-slate-400 block">({{ p.quantityReserved }} held)</span>
                  </td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-emerald-100 text-emerald-800 border-emerald-300': p.status === 'Active',
                      'bg-slate-100 text-slate-700 border-slate-300': p.status === 'Draft',
                      'bg-amber-100 text-amber-800 border-amber-300': p.status === 'Inactive' || p.status === 'OutOfStock',
                      'bg-rose-100 text-rose-800 border-rose-300': p.status === 'Suspended'
                    }" class="px-2.5 py-1 text-xs font-bold rounded-full border">
                      {{ p.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <button (click)="openQuickStockModal(p)" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition">
                        Edit Stock
                      </button>
                      <select (change)="updateStatus(p.id, $any($event.target).value)" class="text-xs rounded-lg border-slate-200 py-1 px-2 bg-white shadow-sm">
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
                  <td colspan="7" class="text-center py-8 text-slate-400">No products found in vendor store. Click "Add New Product" to create one.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Inventory Tab -->
      <div *ngIf="activeTab === 'inventory'">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 class="font-bold text-slate-800">Physical Stock & Reservation Overview</h3>
            <button (click)="loadInventory()" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              🔄 Refresh Inventory
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
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
              <tbody class="divide-y divide-slate-100 text-sm">
                <tr *ngFor="let item of inventoryItems" class="hover:bg-slate-50/80 transition">
                  <td class="px-6 py-4 font-bold text-slate-900">{{ item.productName }}</td>
                  <td class="px-6 py-4 font-mono text-xs text-slate-600">{{ item.productSku }}</td>
                  <td class="px-6 py-4 font-bold text-emerald-700">{{ item.quantityAvailable }} units</td>
                  <td class="px-6 py-4 font-medium text-amber-700">{{ item.quantityReserved }} units</td>
                  <td class="px-6 py-4 font-bold text-slate-900">{{ item.totalPhysicalStock }} units</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">
                      {{ item.productStatus }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end items-center gap-2">
                      <input #stockInput type="number" min="0" [value]="item.quantityAvailable" class="w-20 text-xs rounded-lg border-slate-300 py-1 px-2 text-center">
                      <button (click)="saveInventoryStock(item.productId, +stockInput.value)" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition">
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

    <!-- Create Product Modal -->
    <div *ngIf="showCreateModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div class="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
          <h3 class="text-lg font-bold text-slate-900">Create New Catalog Product</h3>
          <button (click)="showCreateModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form [formGroup]="productForm" (ngSubmit)="submitCreateProduct()">
          <div class="space-y-4 text-sm">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Product Name</label>
              <input formControlName="name" type="text" placeholder="e.g. Organic Honeycrisp Apples" class="w-full rounded-xl border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Category</label>
              <select formControlName="categoryId" class="w-full rounded-xl border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="" disabled>Select Category</option>
                <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">SKU Code</label>
                <input formControlName="sku" type="text" placeholder="PROD-001" class="w-full rounded-xl border-slate-300 py-2 px-3 font-mono text-xs focus:ring-emerald-500 focus:border-emerald-500 uppercase">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Price (\$) </label>
                <input formControlName="price" type="number" step="0.01" min="0.01" placeholder="4.99" class="w-full rounded-xl border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Initial Stock</label>
                <input formControlName="initialQuantity" type="number" min="0" placeholder="50" class="w-full rounded-xl border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Initial Status</label>
                <select formControlName="status" class="w-full rounded-xl border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea formControlName="description" rows="3" placeholder="Enter product specifications and details..." class="w-full rounded-xl border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500"></textarea>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Image URL</label>
              <input formControlName="imageUrl" type="text" placeholder="https://images.unsplash.com/..." class="w-full rounded-xl border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500">
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" (click)="showCreateModal = false" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200">Cancel</button>
            <button type="submit" [disabled]="productForm.invalid || isSubmitting" class="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 disabled:opacity-50">
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
      imageUrl: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80']
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
    this.productForm.reset({
      price: 4.99,
      initialQuantity: 50,
      status: 'Active',
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80'
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

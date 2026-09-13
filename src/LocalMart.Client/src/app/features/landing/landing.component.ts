import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { Category, Product } from '../../core/models/auth.models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProductCardComponent],
  template: `
    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-slate-900 border-b border-slate-800">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-900 to-slate-950 pointer-events-none"></div>
      <div class="max-w-7xl mx-auto px-4 py-20 relative z-10">
        <div class="max-w-3xl">
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Multi-Vendor Hyperlocal Marketplace
          </span>
          <h1 class="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Discover Verified Local Vendors & Fast Neighborhood Delivery
          </h1>
          <p class="text-lg text-slate-300 mb-8 leading-relaxed">
            LocalMart connects local shoppers directly with verified neighborhood vendors. Experience instant inventory updates, direct merchant order fulfillment, and transparent delivery tracking.
          </p>

          <!-- Search Bar -->
          <div class="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div class="relative flex-grow">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                placeholder="Search products or local vendors..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 pl-11 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
              <svg class="w-5 h-5 text-slate-500 absolute left-3.5 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <button
              (click)="onSearch()"
              class="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
              Search Catalog
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Pill Strip -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-white">Explore Categories</h2>
        <span class="text-xs text-slate-400 font-medium">Backend API Synced</span>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        <button
          (click)="selectCategory(null)"
          [class]="selectedCategory() === null ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'"
          class="px-4 py-2 text-xs font-semibold rounded-xl border whitespace-nowrap transition">
          All Products
        </button>
        <button
          *ngFor="let cat of categories()"
          (click)="selectCategory(cat.id)"
          [class]="selectedCategory() === cat.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'"
          class="px-4 py-2 text-xs font-semibold rounded-xl border whitespace-nowrap transition">
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- Live Products Grid -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white">Featured Catalog</h2>
          <p class="text-xs text-slate-400 mt-1">Real-time inventory from PostgreSQL backend database</p>
        </div>
        <span class="text-xs text-slate-400">{{ products().length }} Products Available</span>
      </div>

      <div *ngIf="loading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div *ngFor="let i of [1,2,3,4]" class="bg-slate-900/40 rounded-2xl p-4 border border-slate-800 animate-pulse h-64"></div>
      </div>

      <div *ngIf="!loading() && products().length === 0" class="bg-slate-900/40 rounded-2xl p-12 border border-slate-800 text-center">
        <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        <p class="text-slate-400 text-sm font-medium">No products match your search filter.</p>
      </div>

      <div *ngIf="!loading() && products().length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <app-product-card *ngFor="let prod of products()" [product]="prod"></app-product-card>
      </div>
    </div>
  `
})
export class LandingComponent implements OnInit {
  searchQuery = '';
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  selectedCategory = signal<string | null>(null);

  constructor(private catalogService: CatalogService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (cats: Category[]) => this.categories.set(cats),
      error: () => {}
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.catalogService.getProducts(this.selectedCategory() || undefined, this.searchQuery || undefined).subscribe({
      next: (prods: Product[]) => {
        this.products.set(prods);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectCategory(catId: string | null): void {
    this.selectedCategory.set(catId);
    this.loadProducts();
  }

  onSearch(): void {
    this.loadProducts();
  }
}

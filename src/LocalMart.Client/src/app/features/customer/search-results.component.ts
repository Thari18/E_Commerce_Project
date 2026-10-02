import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { Category, Product, SearchProductsResponse } from '../../core/models/auth.models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/loading/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ProductCardComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-8 transition-colors duration-200">
      
      <!-- Top Search Banner & Input -->
      <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <span class="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20 mb-2">
            LocalMart Catalog Search
          </span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-lm-text-main">Marketplace Search & Discovery</h1>
          <p class="text-lm-text-muted text-xs sm:text-sm mt-1">Explore live products from verified neighborhood vendors</p>
        </div>

        <!-- Search Input Bar -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-grow">
            <input
              type="text"
              [(ngModel)]="searchQueryInput"
              (keyup.enter)="onSearchSubmit()"
              placeholder="Search products, SKUs, or keywords..."
              class="w-full bg-lm-surface-elevated border border-lm-border focus:border-blue-500 rounded-2xl px-4 py-3.5 pl-11 text-lm-text-main placeholder-lm-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm transition-all"
              aria-label="Search catalog products"
            />
            <svg class="w-5 h-5 text-lm-text-muted absolute left-3.5 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <button
            (click)="onSearchSubmit()"
            class="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-blue-500/20 hover:scale-[1.02] flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
            Search Catalog
          </button>
        </div>
      </div>

      <!-- Category Filter Pill Strip -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-lm-text-main uppercase tracking-wider">Filter by Category</h2>
          <span *ngIf="selectedCategory()" class="text-xs text-blue-400 font-medium">Category Filter Active</span>
        </div>
        <div class="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            (click)="selectCategory(null)"
            [class]="selectedCategory() === null ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20 font-bold' : 'bg-lm-surface text-lm-text-muted border-lm-border hover:border-lm-border-hover hover:text-lm-text-main font-medium'"
            class="px-4 py-2 text-xs rounded-xl border whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
            All Categories
          </button>
          <button
            *ngFor="let cat of categories()"
            (click)="selectCategory(cat.id)"
            [class]="selectedCategory() === cat.id ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20 font-bold' : 'bg-lm-surface text-lm-text-muted border-lm-border hover:border-lm-border-hover hover:text-lm-text-main font-medium'"
            class="px-4 py-2 text-xs rounded-xl border whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Active Filters & Results Summary Header -->
      <div class="bg-lm-surface/60 border border-lm-border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-lg font-bold text-lm-text-main">
            Catalog Results
          </h2>
          <p class="text-xs text-lm-text-muted mt-0.5">
            Showing <span class="text-lm-text-main font-bold">{{ totalCount() }}</span> product{{ totalCount() === 1 ? '' : 's' }}
            <span *ngIf="appliedQuery()"> matching "<span class="text-blue-400 font-semibold">{{ appliedQuery() }}</span>"</span>
          </p>
        </div>

        <!-- Active Filter Pills Strip & Clear Button -->
        <div *ngIf="appliedQuery() || selectedCategory()" class="flex items-center gap-2 flex-wrap">
          <span *ngIf="appliedQuery()" class="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold rounded-lg flex items-center gap-1">
            Query: {{ appliedQuery() }}
          </span>
          <button
            (click)="clearFilters()"
            class="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-lg transition">
            Clear Filters
          </button>
        </div>
      </div>

      <!-- API Error State with Retry -->
      <app-error-state
        *ngIf="errorState()"
        title="Search Error"
        [message]="errorMessage()"
        retryLabel="Retry Search"
        (retryClicked)="executeSearch()">
      </app-error-state>

      <!-- Skeleton Loading State -->
      <app-skeleton-loader *ngIf="loading()" type="card" [count]="8"></app-skeleton-loader>

      <!-- Empty State Fallback -->
      <app-empty-state
        *ngIf="!loading() && !errorState() && products().length === 0"
        iconType="search"
        title="No Products Match Your Search Criteria"
        description="We couldn't find any active catalog items matching your filter options. Try searching for different keywords or clear your category selection."
        actionLabel="Clear Search Filters"
        (actionClicked)="clearFilters()">
      </app-empty-state>

      <!-- Products Grid -->
      <div *ngIf="!loading() && !errorState() && products().length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <app-product-card *ngFor="let prod of products()" [product]="prod"></app-product-card>
      </div>

      <!-- Pagination Navigation Controls -->
      <div *ngIf="!loading() && totalPages() > 1" class="flex justify-between items-center pt-6 border-t border-lm-border">
        <button
          (click)="changePage(pageNumber() - 1)"
          [disabled]="pageNumber() <= 1"
          class="px-4 py-2 bg-lm-surface border border-lm-border hover:border-lm-border-hover text-lm-text-main font-semibold text-xs rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed">
          ← Previous Page
        </button>

        <span class="text-xs font-semibold text-lm-text-muted">
          Page <span class="text-lm-text-main font-bold">{{ pageNumber() }}</span> of <span class="text-lm-text-main font-bold">{{ totalPages() }}</span>
        </span>

        <button
          (click)="changePage(pageNumber() + 1)"
          [disabled]="pageNumber() >= totalPages()"
          class="px-4 py-2 bg-lm-surface border border-lm-border hover:border-lm-border-hover text-lm-text-main font-semibold text-xs rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed">
          Next Page →
        </button>
      </div>
    </div>
  `
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogService = inject(CatalogService);

  searchQueryInput = '';
  appliedQuery = signal<string>('');
  selectedCategory = signal<string | null>(null);

  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);

  loading = signal<boolean>(true);
  errorState = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadCategories();

    this.route.queryParams.subscribe(params => {
      const q = params['query'] || '';
      const catId = params['categoryId'] || null;
      const page = parseInt(params['pageNumber'] || '1', 10);

      this.searchQueryInput = q;
      this.appliedQuery.set(q);
      this.selectedCategory.set(catId);
      this.pageNumber.set(isNaN(page) || page < 1 ? 1 : page);

      this.executeSearch();
    });
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => {}
    });
  }

  executeSearch(): void {
    this.loading.set(true);
    this.errorState.set(false);

    this.catalogService.searchProducts(
      this.appliedQuery() || undefined,
      this.selectedCategory() || undefined,
      this.pageNumber(),
      this.pageSize()
    ).subscribe({
      next: (res: SearchProductsResponse) => {
        this.products.set(res.products || []);
        this.totalCount.set(res.totalCount || 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorState.set(true);
        this.errorMessage.set(err.error?.detail || 'Failed to load catalog search results.');
      }
    });
  }

  onSearchSubmit(): void {
    this.navigateToParams(this.searchQueryInput, this.selectedCategory(), 1);
  }

  selectCategory(catId: string | null): void {
    this.navigateToParams(this.searchQueryInput, catId, 1);
  }

  clearFilters(): void {
    this.searchQueryInput = '';
    this.navigateToParams('', null, 1);
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.navigateToParams(this.appliedQuery(), this.selectedCategory(), newPage);
    }
  }

  totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize()) || 1;
  }

  private navigateToParams(query: string, categoryId: string | null, page: number): void {
    const queryParams: any = {};
    if (query) queryParams.query = query;
    if (categoryId) queryParams.categoryId = categoryId;
    if (page > 1) queryParams.pageNumber = page;

    this.router.navigate(['/products/search'], { queryParams });
  }
}

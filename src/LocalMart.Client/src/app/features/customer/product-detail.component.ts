import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductDetailDto } from '../../core/models/auth.models';
import { SkeletonLoaderComponent } from '../../shared/components/loading/skeleton-loader.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SkeletonLoaderComponent, ErrorStateComponent],
  template: `

    <div class="max-w-7xl mx-auto px-4 py-8 transition-colors duration-200">
      <!-- Loading Skeleton State -->
      <app-skeleton-loader *ngIf="loading()" type="detail"></app-skeleton-loader>

      <!-- 404 / Unavailable Error State -->
      <app-error-state
        *ngIf="!loading() && errorState()"
        title="Product Unavailable or Not Found"
        [message]="errorMessage() || 'This product may have been unlisted by the vendor or is currently out of stock.'">
      </app-error-state>

      <!-- Product Detail Main View -->
      <div *ngIf="!loading() && !errorState() && product()" class="space-y-8">
        <!-- Breadcrumbs -->
        <nav aria-label="Breadcrumb" class="flex items-center text-xs text-lm-text-muted space-x-2">
          <a routerLink="/" class="hover:text-lm-text-main transition-colors">Home</a>
          <span>/</span>
          <a [routerLink]="['/products/search']" [queryParams]="{ categoryId: product()?.categoryId }" class="hover:text-lm-text-main transition-colors">
            {{ product()?.categoryName }}
          </a>
          <span>/</span>
          <span class="text-lm-text-main font-semibold truncate max-w-xs">{{ product()?.name }}</span>
        </nav>

        <!-- Main Product Grid: Gallery + Purchasing Card -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          <!-- Left Column: Multi-Image Gallery -->
          <div class="space-y-4">
            <!-- Primary Image Viewer -->
            <div class="bg-lm-surface-elevated border border-lm-border rounded-3xl overflow-hidden aspect-video sm:aspect-square relative shadow-lg">
              <img
                [src]="selectedImage()"
                [alt]="product()?.name"
                class="w-full h-full object-cover transition-all duration-300"
              />
              <span class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur shadow-md">
                {{ product()?.status }}
              </span>
            </div>

            <!-- Image Thumbnails Grid -->
            <div *ngIf="product()?.imageUrls && (product()?.imageUrls)!.length > 1" class="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              <button
                *ngFor="let img of product()?.imageUrls; let i = index"
                (click)="selectImage(img)"
                [class]="selectedImage() === img ? 'border-blue-500 ring-2 ring-blue-500/40 opacity-100' : 'border-lm-border opacity-70 hover:opacity-100'"
                class="w-20 h-20 rounded-2xl overflow-hidden border bg-lm-surface-elevated flex-shrink-0 transition-all focus:outline-none"
                [attr.aria-label]="'Product thumbnail ' + (i + 1)">
                <img [src]="img" [alt]="product()?.name + ' thumbnail ' + (i + 1)" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <!-- Right Column: Product Info & Purchase Controls -->
          <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
            <div class="space-y-4">
              <!-- Vendor Store Identity Badge -->
              <div class="flex items-center justify-between">
                <span class="text-xs bg-blue-500/10 text-blue-400 font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-blue-500/20">
                  Store: {{ product()?.vendorBusinessName }}
                </span>
                <span class="font-mono text-xs text-lm-text-muted bg-lm-surface-elevated px-2.5 py-1 rounded-lg border border-lm-border">
                  SKU: {{ product()?.sku }}
                </span>
              </div>

              <!-- Product Title & Price -->
              <h1 class="text-2xl sm:text-3xl font-extrabold text-lm-text-main tracking-tight leading-snug">
                {{ product()?.name }}
              </h1>

              <div class="flex items-baseline gap-4 pt-2">
                <div class="text-3xl sm:text-4xl font-black text-lm-text-main">
                  {{ product()?.price | number:'1.2-2' }}
                </div>
              </div>

              <!-- Stock Availability Status Pill -->
              <div class="pt-2">
                <span *ngIf="product()?.inStock && (product()?.quantityAvailable || 0) > 0" class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  In Stock ({{ product()?.quantityAvailable }} units available)
                </span>
                <span *ngIf="!product()?.inStock || (product()?.quantityAvailable || 0) <= 0" class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <span class="w-2 h-2 rounded-full bg-rose-400"></span>
                  Out of Stock
                </span>
              </div>

              <!-- Detailed Description Snippet -->
              <div class="pt-4 border-t border-lm-border">
                <h2 class="text-xs font-bold text-lm-text-muted uppercase tracking-wider mb-2">Product Description</h2>
                <p class="text-lm-text-main text-sm leading-relaxed whitespace-pre-line">
                  {{ product()?.description }}
                </p>
              </div>
            </div>

            <!-- Purchasing Controls Section -->
            <div class="space-y-4 pt-6 border-t border-lm-border">
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <!-- Quantity Stepper -->
                <div class="flex items-center justify-between bg-lm-surface-elevated border border-lm-border rounded-2xl p-1.5 w-full sm:w-36">
                  <button
                    (click)="decrementQty()"
                    [disabled]="quantity() <= 1 || !product()?.inStock"
                    class="w-10 h-10 rounded-xl bg-lm-surface hover:bg-lm-border-hover text-lm-text-main font-bold flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    aria-label="Decrease quantity">
                    -
                  </button>
                  <span class="font-bold text-lm-text-main text-sm px-2">{{ quantity() }}</span>
                  <button
                    (click)="incrementQty()"
                    [disabled]="!product()?.inStock || quantity() >= (product()?.quantityAvailable || 0)"
                    class="w-10 h-10 rounded-xl bg-lm-surface hover:bg-lm-border-hover text-lm-text-main font-bold flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    aria-label="Increase quantity">
                    +
                  </button>
                </div>

                <!-- Add to Cart CTA Button -->
                <button
                  (click)="addToCart()"
                  [disabled]="!product()?.inStock || (product()?.quantityAvailable || 0) <= 0"
                  class="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"></path>
                  </svg>
                  <span>Add to Shopping Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private toastService = inject(ToastService);

  product = signal<ProductDetailDto | null>(null);
  selectedImage = signal<string>('');
  quantity = signal<number>(1);
  loading = signal<boolean>(true);
  errorState = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const idOrSlug = params['idOrSlug'];
      if (idOrSlug) {
        this.loadProductDetail(idOrSlug);
      }
    });
  }

  loadProductDetail(idOrSlug: string): void {
    this.loading.set(true);
    this.errorState.set(false);

    this.catalogService.getProductDetail(idOrSlug).subscribe({
      next: (detail: ProductDetailDto) => {
        this.product.set(detail);
        this.loading.set(false);
        if (detail.imageUrls && detail.imageUrls.length > 0) {
          this.selectedImage.set(detail.imageUrls[0]);
        } else {
          this.selectedImage.set('/assets/placeholder.png');
        }
        this.quantity.set(detail.inStock && detail.quantityAvailable > 0 ? 1 : 0);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorState.set(true);
        this.errorMessage.set(err.error?.detail || `Product '${idOrSlug}' was not found or is currently unavailable.`);
      }
    });
  }

  selectImage(img: string): void {
    this.selectedImage.set(img);
  }

  incrementQty(): void {
    const p = this.product();
    if (p && p.inStock && this.quantity() < p.quantityAvailable) {
      this.quantity.update(q => q + 1);
    }
  }

  decrementQty(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  private router = inject(Router);
  private cartService = inject(CartService);
  private authService = inject(AuthService);

  addToCart(): void {
    const p = this.product();
    if (!p || !p.inStock || p.quantityAvailable <= 0) return;

    if (!this.authService.isAuthenticated()) {
      this.toastService.warning('Please log in to add items to your shopping cart');
      this.router.navigate(['/login']);
      return;
    }

    this.cartService.addItem(p.id, this.quantity()).subscribe();
  }
}


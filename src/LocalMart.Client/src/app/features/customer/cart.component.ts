import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonLoaderComponent } from '../../shared/components/loading/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <!-- Loading Skeleton State -->
      <app-skeleton-loader *ngIf="cartService.isLoading()" type="card"></app-skeleton-loader>

      <!-- Error State -->
      <app-error-state
        *ngIf="!cartService.isLoading() && cartService.error()"
        title="Unable to Load Cart"
        [message]="cartService.error() || 'An error occurred while retrieving your shopping cart.'"
        (retryClicked)="onRetry()">
      </app-error-state>

      <!-- Empty Cart State -->
      <app-empty-state
        *ngIf="!cartService.isLoading() && !cartService.error() && cartService.isEmpty()"
        iconType="box"
        title="Your Shopping Cart is Empty"
        message="Browse your neighborhood stores and discover fresh produce, dairy, bakery, and local artisanal goods."
        actionText="Explore Marketplace"
        actionRoute="/">
      </app-empty-state>

      <!-- Normal Cart Content -->
      <div *ngIf="!cartService.isLoading() && !cartService.error() && !cartService.isEmpty()" class="space-y-8">
        
        <!-- Header Banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl sm:text-3xl font-black text-lm-text-main tracking-tight">Shopping Cart</h1>
              <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                {{ cartService.itemCount() }} {{ cartService.itemCount() === 1 ? 'item' : 'items' }}
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-lm-surface-elevated text-lm-text-muted border border-lm-border">
                {{ cartService.vendorCount() }} {{ cartService.vendorCount() === 1 ? 'store' : 'stores' }}
              </span>
            </div>
            <p class="text-xs text-lm-text-muted mt-1">Review items grouped by neighborhood vendor before proceeding to checkout.</p>
          </div>

          <button
            (click)="onClearCart()"
            [disabled]="cartService.isMutating()"
            class="self-start sm:self-auto px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/20 transition disabled:opacity-50 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Cart
          </button>
        </div>

        <!-- Main Grid: Multi-Vendor Items + Sticky Summary Sidebar -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <!-- Vendor Groups Column -->
          <div class="lg:col-span-2 space-y-6">
            <div
              *ngFor="let group of cartService.cart()?.vendorGroups"
              class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-4">

              
              <!-- Vendor Header -->
              <div class="flex items-center justify-between pb-3 border-b border-lm-border">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                    🏬
                  </div>
                  <div>
                    <h2 class="font-bold text-lm-text-main text-base">{{ group.vendorStoreName }}</h2>
                    <span class="text-[11px] text-lm-text-muted">Vendor Subtotal: {{ group.subTotal | number:'1.2-2' }}</span>
                  </div>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-lm-surface-elevated text-lm-text-muted border border-lm-border">
                  {{ group.items.length }} {{ group.items.length === 1 ? 'product' : 'products' }}
                </span>
              </div>

              <!-- Vendor Items List -->
              <div class="divide-y divide-lm-border/60">
                <div
                  *ngFor="let item of group.items"
                  class="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                  
                  <!-- Thumbnail & Title -->
                  <div class="flex items-center gap-4">
                    <img
                      [src]="item.productImageUrl || '/assets/placeholder.png'"
                      [alt]="item.productName"
                      class="w-16 h-16 rounded-2xl object-cover border border-lm-border bg-lm-surface-elevated flex-shrink-0"
                    />
                    <div>
                      <a [routerLink]="['/products', item.productSlug || item.productId]" class="font-bold text-lm-text-main hover:text-lm-primary transition-colors text-sm block">
                        {{ item.productName }}
                      </a>
                      <span class="text-[11px] font-mono text-lm-text-muted">SKU: {{ item.sku }}</span>
                      
                      <!-- Availability Warning -->
                      <div *ngIf="!item.isAvailable" class="mt-1">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                          Unavailable / Stock Exceeded (Max: {{ item.quantityAvailable }})
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Price, Stepper & Controls -->
                  <div class="flex items-center justify-between w-full sm:w-auto gap-6 self-end sm:self-center">
                    
                    <!-- Unit Price & Subtotal -->
                    <div class="text-right">
                      <div class="font-black text-lm-text-main text-sm">
                        {{ item.totalPrice | number:'1.2-2' }}
                      </div>
                      <div class="text-[11px] text-lm-text-muted">
                        {{ item.unitPrice | number:'1.2-2' }} each
                      </div>
                    </div>

                    <!-- Quantity Stepper -->
                    <div class="flex items-center bg-lm-surface-elevated border border-lm-border rounded-xl p-1">
                      <button
                        (click)="onUpdateQuantity(item.id, item.quantity - 1)"
                        [disabled]="cartService.isMutating()"
                        class="w-7 h-7 rounded-lg bg-lm-surface hover:bg-lm-border-hover text-lm-text-main font-bold flex items-center justify-center transition disabled:opacity-40"
                        aria-label="Decrease quantity">
                        -
                      </button>
                      <span class="font-bold text-lm-text-main text-xs px-2.5">{{ item.quantity }}</span>
                      <button
                        (click)="onUpdateQuantity(item.id, item.quantity + 1)"
                        [disabled]="cartService.isMutating() || item.quantity >= item.quantityAvailable"
                        class="w-7 h-7 rounded-lg bg-lm-surface hover:bg-lm-border-hover text-lm-text-main font-bold flex items-center justify-center transition disabled:opacity-40"
                        aria-label="Increase quantity">
                        +
                      </button>
                    </div>

                    <!-- Remove Item Button -->
                    <button
                      (click)="onRemoveItem(item.id)"
                      [disabled]="cartService.isMutating()"
                      class="text-lm-text-muted hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition disabled:opacity-40"
                      title="Remove item">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Sticky Order Summary Sidebar -->
          <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-6 sticky top-24">
            <h2 class="font-black text-lm-text-main text-lg tracking-tight pb-3 border-b border-lm-border">
              Order Summary
            </h2>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between text-lm-text-muted">
                <span>Subtotal</span>
                <span class="font-semibold text-lm-text-main">{{ cartService.subTotal() | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-lm-text-muted">
                <span>Estimated Delivery Fee</span>
                <span class="font-semibold text-lm-text-main">{{ cartService.deliveryFee() | number:'1.2-2' }}</span>
              </div>
              <div class="pt-3 border-t border-lm-border flex justify-between items-baseline">
                <span class="font-bold text-lm-text-main text-base">Grand Total</span>
                <span class="font-black text-2xl text-lm-text-main">
                  {{ cartService.grandTotal() | number:'1.2-2' }}
                </span>
              </div>
            </div>

            <button
              (click)="onProceedToCheckout()"
              [disabled]="cartService.isEmpty() || hasUnavailableItems()"
              class="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
              <span>Proceed to Checkout</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <p class="text-[11px] text-lm-text-muted text-center leading-relaxed">
              Taxes & final delivery options calculated during checkout placement.
            </p>
          </div>

        </div>

      </div>
    </div>
  `
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);

  ngOnInit(): void {
    this.cartService.loadCart().subscribe({ error: () => {} });
  }

  onRetry(): void {
    this.cartService.loadCart().subscribe({ error: () => {} });
  }

  onUpdateQuantity(itemId: string, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.onRemoveItem(itemId);
      return;
    }
    this.cartService.updateItem(itemId, newQuantity).subscribe({ error: () => {} });
  }

  onRemoveItem(itemId: string): void {
    this.cartService.removeItem(itemId).subscribe({ error: () => {} });
  }

  onClearCart(): void {
    if (confirm('Are you sure you want to clear all items from your shopping cart?')) {
      this.cartService.clearCart().subscribe({ error: () => {} });
    }
  }

  hasUnavailableItems(): boolean {
    const groups = this.cartService.cart()?.vendorGroups ?? [];
    for (const group of groups) {
      for (const item of group.items) {
        if (!item.isAvailable || item.quantity > item.quantityAvailable) {
          return true;
        }
      }
    }
    return false;
  }

  onProceedToCheckout(): void {
    this.router.navigate(['/customer/checkout']);
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AddressService } from '../../core/services/address.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { CustomerAddressDto } from '../../core/models/auth.models';
import { CheckoutValidationResultDto } from '../../core/models/order.models';
import { SkeletonLoaderComponent } from '../../shared/components/loading/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      <!-- Loading Skeleton State -->
      <app-skeleton-loader *ngIf="isLoading()" type="card"></app-skeleton-loader>

      <!-- Empty Cart Redirection Notice -->
      <app-empty-state
        *ngIf="!isLoading() && cartService.isEmpty()"
        iconType="box"
        title="Your Cart is Empty"
        message="You cannot proceed to checkout with an empty shopping cart."
        actionText="Return to Cart"
        actionRoute="/customer/cart">
      </app-empty-state>

      <!-- Checkout Content -->
      <div *ngIf="!isLoading() && !cartService.isEmpty()" class="space-y-8">
        
        <!-- Header Banner -->
        <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl sm:text-3xl font-black text-lm-text-main tracking-tight">Checkout</h1>
              <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                Step 2 of 2
              </span>
            </div>
            <p class="text-xs text-lm-text-muted mt-1">Review shipping address, vendor items, and select your preferred payment method.</p>
          </div>
          <a
            routerLink="/customer/cart"
            class="self-start sm:self-auto px-4 py-2 bg-lm-surface-elevated hover:bg-lm-border-hover text-lm-text-main font-bold text-xs rounded-xl border border-lm-border transition flex items-center gap-1.5">
            ← Back to Cart
          </a>
        </div>

        <!-- Main Layout: Form Sections + Sticky Summary Sidebar -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <!-- Left Column: Checkout Sections -->
          <div class="lg:col-span-2 space-y-8">
            
            <!-- Section 1: Delivery Address Selection -->
            <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-6">
              <div class="flex items-center justify-between pb-3 border-b border-lm-border">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                    📍
                  </div>
                  <h2 class="font-bold text-lm-text-main text-lg tracking-tight">1. Delivery Address</h2>
                </div>
                <a
                  routerLink="/customer/addresses"
                  class="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                  + Add / Manage Addresses
                </a>
              </div>

              <!-- No Saved Addresses Warning -->
              <div *ngIf="addresses().length === 0" class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center justify-between">
                <span>No saved delivery addresses found. Please add a shipping address to complete checkout.</span>
                <a routerLink="/customer/addresses" class="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition">
                  Add Address
                </a>
              </div>

              <!-- Address Cards Grid -->
              <div *ngIf="addresses().length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  *ngFor="let addr of addresses()"
                  (click)="selectAddress(addr.id)"
                  [ngClass]="{'border-blue-500 bg-blue-500/10': selectedAddressId() === addr.id}"
                  class="p-4 rounded-2xl border border-lm-border bg-lm-surface-elevated hover:border-blue-500/50 transition cursor-pointer relative space-y-2">
                  
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <input
                        type="radio"
                        [name]="'address_selection'"
                        [checked]="selectedAddressId() === addr.id"
                        class="text-blue-500 focus:ring-blue-500"
                      />
                      <span class="font-bold text-lm-text-main text-sm">{{ addr.title }}</span>
                    </div>
                    <span *ngIf="addr.isDefault" class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                      Default
                    </span>
                  </div>

                  <p class="text-xs text-lm-text-muted leading-relaxed">
                    {{ addr.addressLine1 }}<span *ngIf="addr.addressLine2">, {{ addr.addressLine2 }}</span><br />
                    {{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Section 2: Multi-Vendor Items Review -->
            <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-6">
              <div class="flex items-center gap-3 pb-3 border-b border-lm-border">
                <div class="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                  📦
                </div>
                <h2 class="font-bold text-lm-text-main text-lg tracking-tight">2. Items & Vendor Breakdown</h2>
              </div>

              <div class="space-y-6">
                <div
                  *ngFor="let group of cartService.cart()?.vendorGroups"
                  class="p-4 rounded-2xl bg-lm-surface-elevated border border-lm-border space-y-3">
                  
                  <div class="flex items-center justify-between pb-2 border-b border-lm-border/60">
                    <span class="font-bold text-lm-text-main text-sm flex items-center gap-2">
                      <span>🏬</span> {{ group.vendorStoreName }}
                    </span>
                    <span class="text-xs text-lm-text-muted font-semibold">Subtotal: {{ group.subTotal | number:'1.2-2' }}</span>
                  </div>

                  <div class="divide-y divide-lm-border/40">
                    <div
                      *ngFor="let item of group.items"
                      class="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div>
                        <span class="font-semibold text-lm-text-main">{{ item.productName }}</span>
                        <span class="text-lm-text-muted ml-2">x{{ item.quantity }}</span>
                      </div>
                      <span class="font-bold text-lm-text-main">{{ item.totalPrice | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3: Payment Method Selection -->
            <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-6">
              <div class="flex items-center gap-3 pb-3 border-b border-lm-border">
                <div class="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                  💳
                </div>
                <h2 class="font-bold text-lm-text-main text-lg tracking-tight">3. Payment Method</h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <!-- COD Option -->
                <div
                  (click)="paymentMethod.set('COD')"
                  [ngClass]="{'border-blue-500 bg-blue-500/10': paymentMethod() === 'COD'}"
                  class="p-4 rounded-2xl border border-lm-border bg-lm-surface-elevated hover:border-blue-500/50 transition cursor-pointer space-y-2">
                  <div class="flex items-center gap-2">
                    <input type="radio" name="payment_method" value="COD" [checked]="paymentMethod() === 'COD'" class="text-blue-500 focus:ring-blue-500" />
                    <span class="font-bold text-lm-text-main text-sm">Cash on Delivery (COD)</span>
                  </div>
                  <p class="text-xs text-lm-text-muted leading-relaxed">
                    Pay cash directly upon delivery by neighborhood vendor agents. Order process begins immediately.
                  </p>
                </div>

                <!-- Online Payment Option -->
                <div
                  (click)="paymentMethod.set('Online')"
                  [ngClass]="{'border-blue-500 bg-blue-500/10': paymentMethod() === 'Online'}"
                  class="p-4 rounded-2xl border border-lm-border bg-lm-surface-elevated hover:border-blue-500/50 transition cursor-pointer space-y-2">
                  <div class="flex items-center gap-2">
                    <input type="radio" name="payment_method" value="Online" [checked]="paymentMethod() === 'Online'" class="text-blue-500 focus:ring-blue-500" />
                    <span class="font-bold text-lm-text-main text-sm">Online Payment</span>
                  </div>
                  <p class="text-xs text-lm-text-muted leading-relaxed">
                    Pay securely using credit or debit card. Order status initialized as Pending until payment confirmation.
                  </p>
                </div>

              </div>
            </div>

            <!-- Section 4: Promo Coupon Input -->
            <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-4">
              <div class="flex items-center gap-3 pb-3 border-b border-lm-border">
                <div class="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                  🏷️
                </div>
                <h2 class="font-bold text-lm-text-main text-lg tracking-tight">4. Coupon Code</h2>
              </div>

              <div class="flex items-center gap-3">
                <input
                  type="text"
                  [(ngModel)]="couponCodeInput"
                  placeholder="Enter promo coupon code (optional)"
                  class="flex-1 px-4 py-3 bg-lm-surface-elevated border border-lm-border rounded-xl text-lm-text-main placeholder-lm-text-muted text-sm focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  (click)="onApplyCoupon()"
                  [disabled]="isValidatingCoupon() || !couponCodeInput.trim()"
                  class="px-5 py-3 bg-lm-surface-elevated hover:bg-lm-border-hover text-blue-400 font-bold text-xs rounded-xl border border-lm-border transition disabled:opacity-50">
                  {{ isValidatingCoupon() ? 'Validating...' : 'Apply Coupon' }}
                </button>
              </div>

              <div *ngIf="appliedCoupon()" class="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <span>✓</span> Coupon "{{ appliedCoupon() }}" successfully applied! Discount: {{ discountAmount() | number:'1.2-2' }}
              </div>
            </div>

          </div>

          <!-- Right Column: Sticky Summary Sidebar -->
          <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-6 sticky top-24">
            <h2 class="font-black text-lm-text-main text-lg tracking-tight pb-3 border-b border-lm-border">
              Order Summary
            </h2>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between text-lm-text-muted">
                <span>Subtotal</span>
                <span class="font-semibold text-lm-text-main">{{ subTotal() | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-lm-text-muted">
                <span>Delivery Fee</span>
                <span class="font-semibold text-lm-text-main">{{ deliveryFee() | number:'1.2-2' }}</span>
              </div>
              <div *ngIf="discountAmount() > 0" class="flex justify-between text-emerald-400 font-semibold">
                <span>Promo Discount</span>
                <span>-{{ discountAmount() | number:'1.2-2' }}</span>
              </div>
              <div class="pt-3 border-t border-lm-border flex justify-between items-baseline">
                <span class="font-bold text-lm-text-main text-base">Grand Total</span>
                <span class="font-black text-2xl text-lm-text-main">
                  {{ grandTotal() | number:'1.2-2' }}
                </span>
              </div>
            </div>

            <!-- Error Banner -->
            <div *ngIf="checkoutError()" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {{ checkoutError() }}
            </div>

            <button
              (click)="onPlaceOrder()"
              [disabled]="isPlacingOrder() || !selectedAddressId() || addresses().length === 0"
              class="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
              <span *ngIf="!isPlacingOrder()">Place Order Now</span>
              <span *ngIf="isPlacingOrder()" class="flex items-center gap-2">
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Order...
              </span>
            </button>

            <p class="text-[11px] text-lm-text-muted text-center leading-relaxed">
              By placing your order, you agree to LocalMart terms of service and vendor delivery policies.
            </p>
          </div>

        </div>

      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  cartService = inject(CartService);
  private addressService = inject(AddressService);
  private orderService = inject(OrderService);
  private toast = inject(ToastService);
  private router = inject(Router);

  isLoading = signal<boolean>(true);
  isPlacingOrder = signal<boolean>(false);
  isValidatingCoupon = signal<boolean>(false);

  addresses = signal<CustomerAddressDto[]>([]);
  selectedAddressId = signal<string | null>(null);
  paymentMethod = signal<'COD' | 'Online'>('COD');

  couponCodeInput: string = '';
  appliedCoupon = signal<string | null>(null);
  discountAmount = signal<number>(0);
  checkoutError = signal<string | null>(null);

  ngOnInit(): void {
    this.cartService.loadCart().subscribe({
      next: () => {
        this.loadAddresses();
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadAddresses(): void {
    this.addressService.getAddresses().subscribe({
      next: (addrs) => {
        this.addresses.set(addrs);
        const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
        if (defaultAddr) {
          this.selectedAddressId.set(defaultAddr.id);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toast.error('Failed to load saved addresses.', 'Checkout Error');
        this.isLoading.set(false);
      }
    });
  }

  selectAddress(addressId: string): void {
    this.selectedAddressId.set(addressId);
  }

  subTotal(): number {
    return this.cartService.subTotal();
  }

  deliveryFee(): number {
    return this.cartService.deliveryFee();
  }

  grandTotal(): number {
    const total = this.subTotal() + this.deliveryFee() - this.discountAmount();
    return Math.max(0, total);
  }

  onApplyCoupon(): void {
    if (!this.couponCodeInput.trim() || !this.selectedAddressId()) {
      this.toast.warning('Please select a shipping address and enter a valid coupon code.', 'Coupon Notice');
      return;
    }

    this.isValidatingCoupon.set(true);
    this.checkoutError.set(null);

    this.orderService.validateCheckout({
      shippingAddressId: this.selectedAddressId()!,
      couponCode: this.couponCodeInput.trim()
    }).subscribe({
      next: (valResult) => {
        this.isValidatingCoupon.set(false);
        if (valResult.isValid) {
          this.appliedCoupon.set(this.couponCodeInput.trim());
          this.discountAmount.set(valResult.discountAmount);
          this.toast.success(`Coupon "${this.couponCodeInput.trim()}" applied!`, 'Discount Applied');
        } else {
          this.discountAmount.set(0);
          const errorMsg = valResult.errors.join(' ') || 'Invalid coupon code.';
          this.checkoutError.set(errorMsg);
          this.toast.error(errorMsg, 'Invalid Coupon');
        }
      },
      error: (err) => {
        this.isValidatingCoupon.set(false);
        this.discountAmount.set(0);
        const msg = err.error?.detail || 'Failed to validate coupon code.';
        this.checkoutError.set(msg);
        this.toast.error(msg, 'Coupon Error');
      }
    });
  }

  onPlaceOrder(): void {
    const addressId = this.selectedAddressId();
    if (!addressId) {
      this.toast.warning('Please select a delivery address before placing your order.', 'Address Required');
      return;
    }

    this.isPlacingOrder.set(true);
    this.checkoutError.set(null);

    // Client-side UUID for idempotency
    const idempotencyKey = crypto.randomUUID();

    const request = {
      shippingAddressId: addressId,
      paymentMethod: this.paymentMethod(),
      couponCode: this.appliedCoupon() || undefined
    };

    this.orderService.createOrder(request, idempotencyKey).subscribe({
      next: (order) => {
        this.isPlacingOrder.set(false);
        this.toast.success(`Order ${order.orderNumber} placed successfully!`, 'Order Created');
        
        // Refresh cart (which is now empty on backend)
        this.cartService.loadCart().subscribe({ error: () => {} });

        // Navigate to Order Success page
        this.router.navigate(['/customer/orders', order.id, 'success']);
      },
      error: (err) => {
        this.isPlacingOrder.set(false);
        const msg = err.error?.detail || err.error?.title || 'An error occurred while creating your order. Please try again.';
        this.checkoutError.set(msg);
        this.toast.error(msg, 'Order Failed');
      }
    });
  }
}

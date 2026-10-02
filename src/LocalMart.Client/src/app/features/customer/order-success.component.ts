import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { OrderDto } from '../../core/models/order.models';
import { SkeletonLoaderComponent } from '../../shared/components/loading/skeleton-loader.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SkeletonLoaderComponent,
    ErrorStateComponent
  ],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-12 space-y-8">
      
      <!-- Loading Skeleton State -->
      <app-skeleton-loader *ngIf="isLoading()" type="detail"></app-skeleton-loader>

      <!-- Error State -->
      <app-error-state
        *ngIf="!isLoading() && error()"
        title="Order Details Unavailable"
        [message]="error() || 'Unable to retrieve order details.'"
        (retryClicked)="onRetry()">
      </app-error-state>

      <!-- Order Success Content -->
      <div *ngIf="!isLoading() && order()" class="space-y-8">
        
        <!-- Top Success Banner -->
        <div class="bg-lm-surface border border-lm-border rounded-3xl p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
          
          <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-3xl font-bold shadow-lg shadow-emerald-500/10">
            ✓
          </div>

          <div class="space-y-1">
            <h1 class="text-3xl font-black text-lm-text-main tracking-tight">Order Placed Successfully!</h1>
            <p class="text-sm text-lm-text-muted">Thank you for supporting your neighborhood local vendors.</p>
          </div>

          <div class="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-lm-surface-elevated border border-lm-border">
            <span class="text-xs text-lm-text-muted">Order Number:</span>
            <span class="font-mono font-bold text-lm-primary text-sm">{{ order()?.orderNumber }}</span>
          </div>
        </div>

        <!-- Order Information Summary Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Shipping Address Summary -->
          <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-3">
            <h2 class="font-bold text-lm-text-main text-sm uppercase tracking-wider text-lm-text-muted flex items-center gap-2">
              <span>📍</span> Delivery Address
            </h2>
            <div *ngIf="order()?.shippingAddress" class="space-y-1 text-xs">
              <p class="font-bold text-lm-text-main text-sm">{{ order()?.shippingAddress?.title }}</p>
              <p class="text-lm-text-muted">
                {{ order()?.shippingAddress?.addressLine1 }}<span *ngIf="order()?.shippingAddress?.addressLine2">, {{ order()?.shippingAddress?.addressLine2 }}</span>
              </p>
              <p class="text-lm-text-muted">
                {{ order()?.shippingAddress?.city }}, {{ order()?.shippingAddress?.state }} {{ order()?.shippingAddress?.postalCode }}
              </p>
            </div>
          </div>

          <!-- Payment Information Summary -->
          <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-3">
            <h2 class="font-bold text-lm-text-main text-sm uppercase tracking-wider text-lm-text-muted flex items-center gap-2">
              <span>💳</span> Payment Information
            </h2>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-lm-text-muted">Payment Method:</span>
                <span class="font-bold text-lm-text-main px-2.5 py-0.5 rounded-lg bg-lm-surface-elevated border border-lm-border">
                  {{ order()?.paymentMethod }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-lm-text-muted">Payment Status:</span>
                <span class="font-bold text-amber-400 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/20">
                  {{ order()?.paymentStatus }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-lm-text-muted">Placed On:</span>
                <span class="font-semibold text-lm-text-main">
                  {{ order()?.createdAt | date:'medium' }}
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- Vendor Sub-Orders Breakdown -->
        <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-6">
          <h2 class="font-bold text-lm-text-main text-lg tracking-tight pb-3 border-b border-lm-border flex items-center gap-2">
            <span>🏬</span> Vendor Sub-Orders ({{ order()?.vendorOrders?.length || 0 }})
          </h2>

          <div class="space-y-6">
            <div
              *ngFor="let vo of order()?.vendorOrders"
              class="p-5 rounded-2xl bg-lm-surface-elevated border border-lm-border space-y-4">
              
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-lm-border/60">
                <div>
                  <h3 class="font-bold text-lm-text-main text-base">{{ vo.vendorStoreName }}</h3>
                  <span class="text-[11px] font-mono text-lm-text-muted">Sub-Order #: {{ vo.subOrderNumber }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    Status: {{ vo.status }}
                  </span>
                  <span class="text-xs font-bold text-lm-text-main">
                    Subtotal: {{ vo.subTotal | number:'1.2-2' }}
                  </span>
                </div>
              </div>

              <!-- Sub-order Items -->
              <div class="divide-y divide-lm-border/40">
                <div
                  *ngFor="let item of vo.items"
                  class="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-semibold text-lm-text-main">{{ item.productName }}</span>
                    <span class="text-lm-text-muted ml-2">x{{ item.quantity }} &#64; {{ item.unitPrice | number:'1.2-2' }}</span>
                  </div>
                  <span class="font-bold text-lm-text-main">{{ item.totalPrice | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Financial Summary Card -->
        <div class="bg-lm-surface border border-lm-border rounded-3xl p-6 shadow-xl space-y-3">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between text-lm-text-muted">
              <span>Subtotal</span>
              <span class="font-semibold text-lm-text-main">{{ order()?.subTotal | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between text-lm-text-muted">
              <span>Delivery Fee</span>
              <span class="font-semibold text-lm-text-main">{{ order()?.deliveryFee | number:'1.2-2' }}</span>
            </div>
            <div *ngIf="(order()?.discountAmount || 0) > 0" class="flex justify-between text-emerald-400 font-semibold">
              <span>Promo Discount</span>
              <span>-{{ order()?.discountAmount | number:'1.2-2' }}</span>
            </div>
            <div class="pt-3 border-t border-lm-border flex justify-between items-baseline">
              <span class="font-bold text-lm-text-main text-base">Grand Total Paid</span>
              <span class="font-black text-2xl text-lm-text-main">
                {{ order()?.grandTotal | number:'1.2-2' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Navigation Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            routerLink="/"
            class="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-center">
            Continue Shopping
          </a>
          <a
            routerLink="/customer/dashboard"
            class="w-full sm:w-auto px-8 py-3.5 bg-lm-surface-elevated hover:bg-lm-border-hover text-lm-text-main font-bold text-sm rounded-2xl border border-lm-border transition text-center">
            View My Account
          </a>
        </div>

      </div>
    </div>
  `
})
export class OrderSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  order = signal<OrderDto | null>(null);

  ngOnInit(): void {
    this.loadOrderDetails();
  }

  loadOrderDetails(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId) {
      this.error.set('Invalid order identifier.');
      this.isLoading.set(false);
      return;
    }

    this.orderService.getOrderById(orderId).subscribe({
      next: (orderData) => {
        this.order.set(orderData);
        this.isLoading.set(false);
      },
      error: (err) => {
        const msg = err.error?.detail || 'Unable to retrieve order details.';
        this.error.set(msg);
        this.isLoading.set(false);
      }
    });
  }

  onRetry(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.loadOrderDetails();
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8 transition-colors duration-200">
      <div class="bg-lm-surface border border-lm-border rounded-3xl p-8 shadow-xl">
        <span class="text-xs bg-blue-500/10 text-blue-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-500/20">
          Vendor Store Portal
        </span>
        <h1 class="text-3xl font-black text-lm-text-main mt-2">Vendor Dashboard — {{ authService.currentUser()?.firstName }}</h1>
        <p class="text-lm-text-muted text-sm mt-1">Manage catalog products, inventory stock levels, and sub-order fulfillment workflow.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-lm-surface border border-lm-border p-6 rounded-2xl space-y-2 hover:border-lm-border-hover transition-colors shadow-sm">
          <span class="text-2xl">🏪</span>
          <h3 class="text-lg font-bold text-lm-text-main">Store Profile</h3>
          <p class="text-lm-text-muted text-xs">Configure store hours, logo, banner, and location radius.</p>
        </div>
        <div class="bg-lm-surface border border-lm-border p-6 rounded-2xl space-y-2 hover:border-lm-border-hover transition-colors shadow-sm">
          <span class="text-2xl">🏷️</span>
          <h3 class="text-lg font-bold text-lm-text-main">Product Catalog</h3>
          <p class="text-lm-text-muted text-xs">Create & publish items with Cloudinary signed image uploads.</p>
        </div>
        <div class="bg-lm-surface border border-lm-border p-6 rounded-2xl space-y-2 hover:border-lm-border-hover transition-colors shadow-sm">
          <span class="text-2xl">📋</span>
          <h3 class="text-lg font-bold text-lm-text-main">Sub-Orders Fulfillment</h3>
          <p class="text-lm-text-muted text-xs">Fulfill sub-orders (Pending → Confirmed → Preparing → ReadyForPickup).</p>
        </div>
      </div>
    </div>
  `
})
export class VendorDashboardComponent {
  authService = inject(AuthService);
}


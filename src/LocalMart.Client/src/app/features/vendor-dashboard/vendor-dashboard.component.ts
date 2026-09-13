import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <span class="text-xs bg-teal-500/10 text-teal-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-teal-500/20">
          Vendor Store Portal
        </span>
        <h1 class="text-3xl font-black text-white mt-2">Vendor Dashboard — {{ authService.currentUser()?.firstName }}</h1>
        <p class="text-slate-400 text-sm mt-1">Manage catalog products, inventory stock levels, and sub-order fulfillment workflow.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <span class="text-2xl">🏪</span>
          <h3 class="text-lg font-bold text-white">Store Profile</h3>
          <p class="text-slate-400 text-xs">Configure store hours, logo, banner, and location radius.</p>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <span class="text-2xl">🏷️</span>
          <h3 class="text-lg font-bold text-white">Product Catalog</h3>
          <p class="text-slate-400 text-xs">Create & publish items with Cloudinary signed image uploads.</p>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <span class="text-2xl">📋</span>
          <h3 class="text-lg font-bold text-white">Sub-Orders Fulfillment</h3>
          <p class="text-slate-400 text-xs">Fulfill sub-orders (Pending → Confirmed → Preparing → ReadyForPickup).</p>
        </div>
      </div>
    </div>
  `
})
export class VendorDashboardComponent {
  authService = inject(AuthService);
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8 transition-colors duration-200">
      <div class="bg-lm-surface border border-lm-border rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span class="text-xs bg-blue-500/10 text-blue-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-500/20">
            Customer Account Active
          </span>
          <h1 class="text-3xl font-black text-lm-text-main mt-2">Welcome Back, {{ authService.currentUser()?.firstName }}!</h1>
          <p class="text-lm-text-muted text-sm mt-1">Manage your active cart, delivery addresses, and multi-vendor orders.</p>
        </div>
        <a routerLink="/" class="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02]">
          Browse Marketplace Products
        </a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-lm-surface border border-lm-border p-6 rounded-2xl space-y-2 hover:border-lm-border-hover transition-colors shadow-sm">
          <span class="text-2xl">🛒</span>
          <h3 class="text-lg font-bold text-lm-text-main">Active Shopping Cart</h3>
          <p class="text-lm-text-muted text-xs">Multi-vendor item grouping with real-time stock validation.</p>
        </div>
        <div class="bg-lm-surface border border-lm-border p-6 rounded-2xl space-y-2 hover:border-lm-border-hover transition-colors shadow-sm">
          <span class="text-2xl">📦</span>
          <h3 class="text-lg font-bold text-lm-text-main">My Orders</h3>
          <p class="text-lm-text-muted text-xs">Track parent orders and individual vendor sub-orders.</p>
        </div>
        <a routerLink="/customer/addresses" class="bg-lm-surface border border-lm-border p-6 rounded-2xl space-y-2 hover:border-blue-500/50 hover:shadow-lm-glow transition-all shadow-sm block group cursor-pointer">
          <span class="text-2xl">📍</span>
          <h3 class="text-lg font-bold text-lm-text-main group-hover:text-blue-400 transition-colors">Saved Delivery Addresses</h3>
          <p class="text-lm-text-muted text-xs">Location coordinates used for neighborhood vendor discovery.</p>
        </a>
      </div>
    </div>
  `
})
export class CustomerDashboardComponent {
  authService = inject(AuthService);
}


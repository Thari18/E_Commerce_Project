import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span class="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20">
            Customer Account Active
          </span>
          <h1 class="text-3xl font-black text-white mt-2">Welcome Back, {{ authService.currentUser()?.firstName }}!</h1>
          <p class="text-slate-400 text-sm mt-1">Manage your active cart, delivery addresses, and multi-vendor orders.</p>
        </div>
        <a routerLink="/" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg hover:scale-105">
          Browse Marketplace Products
        </a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <span class="text-2xl">🛒</span>
          <h3 class="text-lg font-bold text-white">Active Shopping Cart</h3>
          <p class="text-slate-400 text-xs">Multi-vendor item grouping with real-time stock validation.</p>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <span class="text-2xl">📦</span>
          <h3 class="text-lg font-bold text-white">My Orders</h3>
          <p class="text-slate-400 text-xs">Track parent orders and individual vendor sub-orders.</p>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
          <span class="text-2xl">📍</span>
          <h3 class="text-lg font-bold text-white">Saved Delivery Addresses</h3>
          <p class="text-slate-400 text-xs">Location coordinates used for neighborhood vendor discovery.</p>
        </div>
      </div>
    </div>
  `
})
export class CustomerDashboardComponent {
  authService = inject(AuthService);
}

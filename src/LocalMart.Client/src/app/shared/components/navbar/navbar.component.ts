import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-lm-surface/90 backdrop-blur-md text-lm-text-main shadow-lg sticky top-0 z-50 border-b border-lm-border transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <!-- Brand Logo -->
        <a routerLink="/" class="flex items-center gap-2.5 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center font-extrabold text-white text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            LM
          </div>
          <div>
            <span class="text-xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">LocalMart</span>
            <span class="text-[10px] block text-lm-primary font-semibold tracking-wider uppercase">Location-Aware Marketplace</span>
          </div>
        </a>

        <!-- Quick Links -->
        <nav class="hidden md:flex items-center space-x-6 text-sm font-medium">
          <a routerLink="/" routerLinkActive="text-lm-primary font-bold border-b-2 border-lm-primary pb-0.5" [routerLinkActiveOptions]="{exact: true}" class="text-lm-text-muted hover:text-lm-primary transition-colors duration-200">Marketplace</a>
          <a routerLink="/vendor-application" *ngIf="!authService.hasRole('Vendor')" routerLinkActive="text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5" class="text-amber-500/90 hover:text-amber-400 transition-colors font-semibold">Sell on LocalMart</a>
          <a routerLink="/customer/dashboard" *ngIf="authService.hasRole('Customer')" routerLinkActive="text-lm-primary font-bold border-b-2 border-lm-primary pb-0.5" class="text-lm-text-muted hover:text-lm-primary transition-colors duration-200">My Orders</a>
          <a routerLink="/vendor/dashboard" *ngIf="authService.hasRole('Vendor')" routerLinkActive="text-lm-primary font-bold border-b-2 border-lm-primary pb-0.5" class="text-lm-text-muted hover:text-lm-primary transition-colors duration-200">Vendor Store</a>
          <a routerLink="/vendor/products" *ngIf="authService.hasRole('Vendor')" routerLinkActive="text-lm-primary font-bold border-b-2 border-lm-primary pb-0.5" class="text-lm-text-muted hover:text-lm-primary transition-colors duration-200">My Catalog</a>
          <a routerLink="/admin/dashboard" *ngIf="authService.hasRole('Admin')" routerLinkActive="text-lm-primary font-bold border-b-2 border-lm-primary pb-0.5" class="text-lm-text-muted hover:text-lm-primary transition-colors duration-200">Admin Portal</a>
          <a routerLink="/delivery/dashboard" *ngIf="authService.hasRole('Delivery Staff')" routerLinkActive="text-lm-primary font-bold border-b-2 border-lm-primary pb-0.5" class="text-lm-text-muted hover:text-lm-primary transition-colors duration-200">Delivery Tasks</a>
        </nav>

        <!-- Right Side Auth Navigation -->
        <div class="flex items-center space-x-4">
          <ng-container *ngIf="authService.currentUser(); else guestTpl">
            
            <!-- Customer Shopping Cart Icon with Badge -->
            <a
              *ngIf="authService.hasRole('Customer')"
              routerLink="/customer/cart"
              routerLinkActive="text-lm-primary font-bold bg-lm-surface-elevated"
              class="relative flex items-center gap-1.5 text-lm-text-muted hover:text-lm-text-main transition-colors px-3 py-2 rounded-xl border border-lm-border bg-lm-surface-elevated/40"
              aria-label="Shopping Cart">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span class="hidden sm:inline text-xs font-semibold">Cart</span>
              <span
                *ngIf="cartService.itemCount() > 0"
                class="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md shadow-blue-500/30 border border-blue-400/40">
                {{ cartService.itemCount() }}
              </span>
            </a>

            <div class="flex items-center space-x-3 bg-lm-surface-elevated/80 backdrop-blur px-3 py-1.5 rounded-full border border-lm-border shadow-sm">
              <div class="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase border border-blue-500/30">
                {{ authService.currentUser()?.firstName?.charAt(0) }}
              </div>
              <div class="text-left hidden sm:block">
                <span class="text-xs font-semibold block text-lm-text-main">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium inline-block uppercase tracking-wider border border-blue-500/20">
                  {{ authService.userRoles()[0] || 'Customer' }}
                </span>
              </div>
            </div>

            <button (click)="onLogout()" class="text-xs bg-lm-surface-elevated hover:bg-lm-border-hover text-lm-text-muted hover:text-lm-text-main px-3 py-2 rounded-xl transition-colors border border-lm-border">
              Logout
            </button>
          </ng-container>

          <ng-template #guestTpl>
            <a routerLink="/login" class="text-sm font-medium text-lm-text-muted hover:text-lm-text-main px-3 py-2 rounded-xl transition-colors">
              Sign In
            </a>
            <a routerLink="/register" class="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all hover:scale-[1.02]">
              Register Account
            </a>
          </ng-template>
        </div>

      </div>
    </header>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);

  onLogout(): void {

    this.authService.logout();
    this.router.navigate(['/login']);
  }
}


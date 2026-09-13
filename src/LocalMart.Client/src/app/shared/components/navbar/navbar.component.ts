import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-slate-900 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <!-- Brand Logo -->
        <a routerLink="/" class="flex items-center gap-2 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-xl shadow-md group-hover:scale-105 transition-transform">
            LM
          </div>
          <div>
            <span class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">LocalMart</span>
            <span class="text-xs block text-emerald-400 font-medium tracking-wide">Location-Aware Marketplace</span>
          </div>
        </a>

        <!-- Quick Links -->
        <nav class="hidden md:flex items-center space-x-6 text-sm font-medium">
          <a routerLink="/" routerLinkActive="text-emerald-400 font-semibold" [routerLinkActiveOptions]="{exact: true}" class="hover:text-emerald-400 transition-colors">Marketplace</a>
          <a routerLink="/vendor-application" *ngIf="!authService.hasRole('Vendor')" routerLinkActive="text-amber-400 font-semibold" class="text-amber-400/90 hover:text-amber-300 transition-colors font-semibold">Sell on LocalMart</a>
          <a routerLink="/customer/dashboard" *ngIf="authService.hasRole('Customer')" class="hover:text-emerald-400 transition-colors">My Orders</a>
          <a routerLink="/vendor/dashboard" *ngIf="authService.hasRole('Vendor')" class="hover:text-emerald-400 transition-colors">Vendor Store</a>
          <a routerLink="/vendor/products" *ngIf="authService.hasRole('Vendor')" class="hover:text-emerald-400 transition-colors">My Catalog</a>
          <a routerLink="/admin/dashboard" *ngIf="authService.hasRole('Admin')" class="hover:text-emerald-400 transition-colors">Admin Portal</a>
          <a routerLink="/delivery/dashboard" *ngIf="authService.hasRole('Delivery Staff')" class="hover:text-emerald-400 transition-colors">Delivery Tasks</a>
        </nav>

        <!-- Right Side Auth Navigation -->
        <div class="flex items-center space-x-4">
          <ng-container *ngIf="authService.currentUser(); else guestTpl">
            
            <div class="flex items-center space-x-3 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700">
              <div class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs uppercase">
                {{ authService.currentUser()?.firstName?.charAt(0) }}
              </div>
              <div class="text-left hidden sm:block">
                <span class="text-xs font-semibold block text-slate-200">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium inline-block uppercase tracking-wider">
                  {{ authService.userRoles()[0] || 'Customer' }}
                </span>
              </div>
            </div>

            <button (click)="onLogout()" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors border border-slate-700">
              Logout
            </button>
          </ng-container>

          <ng-template #guestTpl>
            <a routerLink="/login" class="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors">
              Sign In
            </a>
            <a routerLink="/register" class="text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-2 rounded-xl shadow-md hover:shadow-emerald-500/25 transition-all">
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
  private router = inject(Router);

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { VendorApplicationComponent } from './features/vendor-application/vendor-application.component';
import { VendorSetPasswordComponent } from './features/vendor/vendor-set-password.component';
import { CustomerDashboardComponent } from './features/customer-dashboard/customer-dashboard.component';
import { VendorDashboardComponent } from './features/vendor-dashboard/vendor-dashboard.component';
import { AdminDashboardComponent } from './features/admin-dashboard/admin-dashboard.component';
import { DeliveryDashboardComponent } from './features/delivery-dashboard/delivery-dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'vendor-application', component: VendorApplicationComponent },
  { path: 'vendor/set-password', component: VendorSetPasswordComponent },
  {
    path: 'customer/dashboard',
    component: CustomerDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Customer'] }
  },
  {
    path: 'vendor/dashboard',
    component: VendorDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Vendor'] }
  },
  {
    path: 'vendor/products',
    loadComponent: () => import('./features/vendor/vendor-catalog.component').then(m => m.VendorCatalogComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Vendor'] }
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] }
  },
  {
    path: 'delivery/dashboard',
    component: DeliveryDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Delivery Staff'] }
  },
  { path: '**', redirectTo: '' }
];

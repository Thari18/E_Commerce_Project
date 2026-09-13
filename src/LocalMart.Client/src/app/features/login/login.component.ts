import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-2xl flex items-center justify-center mx-auto">
          🔑
        </div>
        <h2 class="text-2xl font-black text-white tracking-tight">Sign In to LocalMart</h2>
        <p class="text-slate-400 text-xs">Enter your credentials to access your portal account.</p>
      </div>

      <div *ngIf="errorMessage()" class="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl">
        {{ errorMessage() }}
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
          <input 
            type="email" 
            formControlName="email" 
            placeholder="name@example.com" 
            class="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
          <input 
            type="password" 
            formControlName="password" 
            placeholder="••••••••" 
            class="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
          />
        </div>

        <button 
          type="submit" 
          [disabled]="loginForm.invalid || isSubmitting()" 
          class="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
        >
          {{ isSubmitting() ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <div class="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
        Don't have an account? 
        <a routerLink="/register" class="text-emerald-400 font-semibold hover:underline">Register Customer Account</a>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.loginForm.value;
    this.authService.login({
      email: val.email!,
      password: val.password!
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        const roles = res.user.roles;
        if (roles.includes('Admin')) {
          this.router.navigate(['/admin/dashboard']);
        } else if (roles.includes('Vendor')) {
          this.router.navigate(['/vendor/dashboard']);
        } else if (roles.includes('Delivery Staff')) {
          this.router.navigate(['/delivery/dashboard']);
        } else {
          this.router.navigate(['/customer/dashboard']);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.detail || err.error?.title || 'Invalid login credentials.');
      }
    });
  }
}

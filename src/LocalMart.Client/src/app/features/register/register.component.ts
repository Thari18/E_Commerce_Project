import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-md mx-auto my-10 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-2xl flex items-center justify-center mx-auto">
          🛍️
        </div>
        <h2 class="text-2xl font-black text-white tracking-tight">Create Customer Account</h2>
        <p class="text-slate-400 text-xs">Join LocalMart to discover and order from neighborhood vendors.</p>
      </div>

      <!-- Public Registration Governance Banner -->
      <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl flex items-start gap-2">
        <span class="text-sm">ℹ️</span>
        <div>
          <span class="font-bold">Public Registration Governance:</span> Public accounts are created with the <strong>Customer</strong> role by default. (Vendor onboarding requires submitting a Vendor Application for Admin approval).
        </div>
      </div>

      <div *ngIf="errorMessage()" class="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl">
        {{ errorMessage() }}
      </div>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
            <input 
              type="text" 
              formControlName="firstName" 
              placeholder="Jane" 
              class="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-all"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
            <input 
              type="text" 
              formControlName="lastName" 
              placeholder="Doe" 
              class="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <input 
            type="email" 
            formControlName="email" 
            placeholder="jane.doe@example.com" 
            class="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
          <input 
            type="tel" 
            formControlName="phoneNumber" 
            placeholder="+1 555 123 4567" 
            class="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <input 
            type="password" 
            formControlName="password" 
            placeholder="Minimum 6 characters" 
            class="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-all"
          />
        </div>

        <button 
          type="submit" 
          [disabled]="registerForm.invalid || isSubmitting()" 
          class="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm mt-2"
        >
          {{ isSubmitting() ? 'Creating Account...' : 'Register Customer Account' }}
        </button>
      </form>

      <div class="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
        Already have an account? 
        <a routerLink="/login" class="text-emerald-400 font-semibold hover:underline">Sign In</a>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  registerForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.registerForm.value;
    this.authService.register({
      email: val.email!,
      password: val.password!,
      firstName: val.firstName!,
      lastName: val.lastName!,
      phoneNumber: val.phoneNumber!
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/customer/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.detail || err.error?.title || 'Registration failed. Please try again.');
      }
    });
  }
}

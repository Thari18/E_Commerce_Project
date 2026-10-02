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
    <div class="max-w-md mx-auto my-12 bg-lm-surface border border-lm-border rounded-3xl p-8 shadow-2xl space-y-6 transition-colors duration-200">
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-2xl flex items-center justify-center mx-auto shadow-sm">
          🔑
        </div>
        <h2 class="text-2xl font-black text-lm-text-main tracking-tight">Sign In to LocalMart</h2>
        <p class="text-lm-text-muted text-xs">Enter your credentials or choose a social account to log in.</p>
      </div>

      <div *ngIf="errorMessage()" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3.5 rounded-xl">
        {{ errorMessage() }}
      </div>

      <div *ngIf="socialNotice()" class="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs p-3.5 rounded-xl">
        {{ socialNotice() }}
      </div>

      <!-- Social Login Buttons -->
      <div class="grid grid-cols-2 gap-3">
        <button 
          type="button" 
          (click)="loginWithGoogle()" 
          class="flex items-center justify-center gap-2 bg-lm-surface-elevated hover:bg-lm-border/40 border border-lm-border text-lm-text-main font-semibold py-2.5 px-4 rounded-xl transition-all text-xs shadow-sm hover:scale-[1.02]"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Google
        </button>

        <button 
          type="button" 
          (click)="loginWithGithub()" 
          class="flex items-center justify-center gap-2 bg-lm-surface-elevated hover:bg-lm-border/40 border border-lm-border text-lm-text-main font-semibold py-2.5 px-4 rounded-xl transition-all text-xs shadow-sm hover:scale-[1.02]"
        >
          <svg class="w-4 h-4 fill-current text-lm-text-main" viewBox="0 0 24 24">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          GitHub
        </button>
      </div>

      <!-- Divider -->
      <div class="relative flex items-center justify-center my-4">
        <div class="border-t border-lm-border w-full"></div>
        <span class="bg-lm-surface px-3 text-[10px] font-bold tracking-wider uppercase text-lm-text-muted absolute">OR EMAIL</span>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-lm-text-main mb-1.5">Email Address</label>
          <input 
            type="email" 
            formControlName="email" 
            placeholder="name@example.com" 
            class="w-full bg-lm-surface-elevated border border-lm-border focus:border-blue-500 rounded-xl px-4 py-3 text-lm-text-main placeholder-lm-text-muted text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/25"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-lm-text-main mb-1.5">Password</label>
          <input 
            type="password" 
            formControlName="password" 
            placeholder="••••••••" 
            class="w-full bg-lm-surface-elevated border border-lm-border focus:border-blue-500 rounded-xl px-4 py-3 text-lm-text-main placeholder-lm-text-muted text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/25"
          />
        </div>

        <button 
          type="submit" 
          [disabled]="loginForm.invalid || isSubmitting()" 
          class="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm"
        >
          {{ isSubmitting() ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <div class="text-center text-xs text-lm-text-muted pt-2 border-t border-lm-border">
        Don't have an account? 
        <a routerLink="/register" class="text-blue-500 font-semibold hover:underline">Register Customer Account</a>
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
  socialNotice = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loginWithGoogle(): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.socialNotice.set('Authenticating via Google OAuth...');
    
    this.authService.socialLogin('Google', 'google.user@localmart.com', 'Google User').subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.socialNotice.set('Successfully authenticated with Google!');
        this.router.navigate(['/customer/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.detail || 'Google social authentication failed.');
      }
    });
  }

  loginWithGithub(): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.socialNotice.set('Authenticating via GitHub OAuth...');

    this.authService.socialLogin('GitHub', 'github.user@localmart.com', 'GitHub User').subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.socialNotice.set('Successfully authenticated with GitHub!');
        this.router.navigate(['/customer/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.detail || 'GitHub social authentication failed.');
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.socialNotice.set(null);

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

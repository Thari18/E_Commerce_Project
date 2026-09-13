import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-vendor-set-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Background Glow Accents -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div class="flex items-center justify-center gap-2 mb-4">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-black text-slate-950 text-xl">
            LM
          </div>
          <span class="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">LocalMart</span>
        </div>
        <h2 class="text-center text-2xl font-extrabold tracking-tight text-white">
          Activate Vendor Account
        </h2>
        <p class="mt-2 text-center text-xs text-slate-400">
          Create your password to complete onboarding and access your merchant portal.
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div class="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10">

          <!-- 1. Validating Token State -->
          <div *ngIf="isValidatingToken()" class="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div class="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-slate-300 font-medium">Validating activation link...</p>
            <p class="text-xs text-slate-500">Checking security authorization</p>
          </div>

          <!-- 2. Invalid / Expired / Already-Used Token State -->
          <div *ngIf="!isValidatingToken() && tokenError()" class="py-6 flex flex-col items-center text-center space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-white mb-1">Activation Link Expired or Invalid</h3>
              <p class="text-xs text-slate-400 leading-relaxed">{{ tokenError() }}</p>
            </div>
            <div class="pt-4 flex flex-col gap-2 w-full">
              <a routerLink="/login" class="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition">
                Go to Sign In
              </a>
              <a routerLink="/vendor-application" class="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-semibold text-center transition">
                Check Application Status
              </a>
            </div>
          </div>

          <!-- 3. Password Setup Success State -->
          <div *ngIf="!isValidatingToken() && isSuccess()" class="py-6 flex flex-col items-center text-center space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-white mb-1">Password Created Successfully!</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Your vendor account has been activated. You can now sign in with your email and new password to access your Vendor Portal.
              </p>
            </div>
            <div class="pt-4 w-full">
              <a routerLink="/login" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg shadow-emerald-500/20 transition">
                Sign In to Vendor Portal
              </a>
            </div>
          </div>

          <!-- 4. Password Creation Form -->
          <form *ngIf="!isValidatingToken() && !tokenError() && !isSuccess()" [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <div *ngIf="maskedEmail()" class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
              <span class="text-slate-400">Merchant Account:</span>
              <span class="font-mono text-emerald-400 font-semibold">{{ maskedEmail() }}</span>
            </div>

            <!-- Error Banner -->
            <div *ngIf="submitError()" class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              {{ submitError() }}
            </div>

            <!-- New Password -->
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">New Password *</label>
              <input
                type="password"
                formControlName="newPassword"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                placeholder="••••••••••••"
              />
              <div *ngIf="form.get('newPassword')?.touched && form.get('newPassword')?.errors" class="mt-1 text-[11px] text-rose-400 space-y-0.5">
                <span *ngIf="form.get('newPassword')?.errors?.['required']">Password is required.</span>
                <span *ngIf="form.get('newPassword')?.errors?.['minlength']">Minimum 8 characters required.</span>
              </div>
            </div>

            <!-- Password Requirements Checklist -->
            <div class="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-[11px] space-y-1">
              <p class="font-medium text-slate-400 mb-1">Password must include:</p>
              <div class="grid grid-cols-2 gap-1 text-[10px]">
                <span [class.text-emerald-400]="hasLength()" [class.text-slate-500]="!hasLength()">
                  ✓ 8+ characters
                </span>
                <span [class.text-emerald-400]="hasUpper()" [class.text-slate-500]="!hasUpper()">
                  ✓ Uppercase letter
                </span>
                <span [class.text-emerald-400]="hasLower()" [class.text-slate-500]="!hasLower()">
                  ✓ Lowercase letter
                </span>
                <span [class.text-emerald-400]="hasDigit()" [class.text-slate-500]="!hasDigit()">
                  ✓ Number & Symbol
                </span>
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Confirm Password *</label>
              <input
                type="password"
                formControlName="confirmPassword"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                placeholder="••••••••••••"
              />
              <div *ngIf="form.get('confirmPassword')?.touched && form.errors?.['passwordMismatch']" class="mt-1 text-[11px] text-rose-400">
                Passwords do not match.
              </div>
            </div>

            <button
              type="submit"
              [disabled]="form.invalid || isSubmitting()"
              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span *ngIf="isSubmitting()" class="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin mr-2"></span>
              {{ isSubmitting() ? 'Setting Password...' : 'Save Password & Activate Account' }}
            </button>
          </form>

        </div>
      </div>
    </div>
  `
})
export class VendorSetPasswordComponent implements OnInit {
  form: FormGroup;
  token: string = '';

  isValidatingToken = signal<boolean>(true);
  tokenError = signal<string | null>(null);
  maskedEmail = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  submitError = signal<string | null>(null);
  isSuccess = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.isValidatingToken.set(false);
        this.tokenError.set('No activation token was provided in the link. Please check the link from your approval email.');
        return;
      }
      this.validateToken();
    });
  }

  validateToken(): void {
    this.isValidatingToken.set(true);
    this.tokenError.set(null);

    this.authService.verifyVendorSetupToken(this.token).subscribe({
      next: (res) => {
        this.isValidatingToken.set(false);
        if (res.isValid) {
          this.maskedEmail.set(res.email || null);
        } else {
          this.tokenError.set(res.reason || 'Activation link is invalid or has expired.');
        }
      },
      error: (err) => {
        this.isValidatingToken.set(false);
        this.tokenError.set(err.error?.detail || 'Unable to verify activation link. Please try again later.');
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const p = g.get('newPassword')?.value;
    const c = g.get('confirmPassword')?.value;
    return p && c && p !== c ? { passwordMismatch: true } : null;
  }

  hasLength(): boolean {
    return (this.form.get('newPassword')?.value?.length || 0) >= 8;
  }

  hasUpper(): boolean {
    return /[A-Z]/.test(this.form.get('newPassword')?.value || '');
  }

  hasLower(): boolean {
    return /[a-z]/.test(this.form.get('newPassword')?.value || '');
  }

  hasDigit(): boolean {
    const val = this.form.get('newPassword')?.value || '';
    return /[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const { newPassword, confirmPassword } = this.form.value;

    this.authService.setVendorPassword({
      token: this.token,
      newPassword,
      confirmPassword
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.submitError.set(err.error?.detail || 'Failed to set password. The token may have expired.');
      }
    });
  }
}

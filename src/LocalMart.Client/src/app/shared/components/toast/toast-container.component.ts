import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      class="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
      
      <div
        *ngFor="let t of toastService.toasts()"
        class="pointer-events-auto bg-lm-surface-elevated border rounded-2xl p-4 shadow-2xl transition-all duration-300 transform flex items-start justify-between gap-3"
        [ngClass]="getToastBorderClass(t.type)">
        
        <div class="flex items-start gap-3">
          <!-- Icon Pill -->
          <div [ngClass]="getToastIconBgClass(t.type)" class="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            <span *ngIf="t.type === 'success'">✓</span>
            <span *ngIf="t.type === 'error'">✕</span>
            <span *ngIf="t.type === 'info'">ℹ</span>
            <span *ngIf="t.type === 'warning'">⚠</span>
          </div>

          <!-- Message Body -->
          <div class="space-y-0.5">
            <h4 *ngIf="t.title" class="text-xs font-extrabold text-lm-text-main">{{ t.title }}</h4>
            <p class="text-xs text-lm-text-muted leading-relaxed">{{ t.message }}</p>
          </div>
        </div>

        <!-- Dismiss Button -->
        <button
          (click)="toastService.dismiss(t.id)"
          class="text-lm-text-muted hover:text-lm-text-main p-1 rounded-lg transition"
          aria-label="Close notification">
          ✕
        </button>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getToastBorderClass(type: string): string {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 text-emerald-400';
      case 'error':
        return 'border-rose-500/40 text-rose-400';
      case 'warning':
        return 'border-amber-500/40 text-amber-400';
      case 'info':
      default:
        return 'border-blue-500/40 text-blue-400';
    }
  }

  getToastIconBgClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'error':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'info':
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  }
}

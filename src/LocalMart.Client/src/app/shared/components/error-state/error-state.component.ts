import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      role="alert"
      [ngClass]="isNotice ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-lm-surface border-rose-500/30 text-rose-400'"
      class="border rounded-3xl p-8 text-center shadow-xl max-w-xl mx-auto my-6 space-y-4">
      
      <!-- Alert Icon Container -->
      <div
        [ngClass]="isNotice ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'"
        class="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-2">
        
        <svg *ngIf="!isNotice" class="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>

        <svg *ngIf="isNotice" class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>

      <!-- Title & Message -->
      <h3 [ngClass]="isNotice ? 'text-blue-300' : 'text-lm-text-main'" class="text-lg font-extrabold tracking-tight">
        {{ title }}
      </h3>
      <p [ngClass]="isNotice ? 'text-blue-300/90' : 'text-lm-text-muted'" class="text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
        {{ message }}
      </p>

      <!-- Optional Retry Button -->
      <div *ngIf="retryLabel" class="pt-2">
        <button
          (click)="onRetry()"
          class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-md hover:scale-[1.02]">
          {{ retryLabel }}
        </button>
      </div>
    </div>
  `
})
export class ErrorStateComponent {
  @Input() title: string = 'An Error Occurred';
  @Input() message: string = 'Unable to complete your request. Please try again.';
  @Input() retryLabel?: string;
  @Input() isNotice: boolean = false;

  @Output() retryClicked = new EventEmitter<void>();

  onRetry(): void {
    this.retryClicked.emit();
  }
}

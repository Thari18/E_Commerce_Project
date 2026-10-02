import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-lm-surface border border-lm-border rounded-3xl p-10 sm:p-12 text-center shadow-xl max-w-xl mx-auto my-6 space-y-4">
      
      <!-- Icon Container -->
      <div class="w-16 h-16 bg-lm-surface-elevated text-lm-text-muted border border-lm-border rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
        <ng-container [ngSwitch]="iconType">
          
          <!-- Address Icon -->
          <svg *ngSwitchCase="'address'" class="w-8 h-8 text-lm-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>

          <!-- Box / Catalog Icon -->
          <svg *ngSwitchCase="'box'" class="w-8 h-8 text-lm-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>

          <!-- Default Search Icon -->
          <svg *ngSwitchDefault class="w-8 h-8 text-lm-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </ng-container>
      </div>

      <!-- Title & Description -->
      <h3 class="text-xl font-extrabold text-lm-text-main tracking-tight">{{ title }}</h3>
      <p class="text-lm-text-muted text-xs sm:text-sm max-w-md mx-auto leading-relaxed">{{ description }}</p>

      <!-- Action CTA Button -->
      <div *ngIf="actionLabel" class="pt-2">
        <button
          (click)="onAction()"
          class="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/20 hover:scale-[1.02]">
          {{ actionLabel }}
        </button>
      </div>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() title: string = 'No Data Available';
  @Input() description: string = 'No items found matching your current selection.';
  @Input() actionLabel?: string;
  @Input() iconType: 'search' | 'address' | 'box' = 'search';

  @Output() actionClicked = new EventEmitter<void>();

  onAction(): void {
    this.actionClicked.emit();
  }
}

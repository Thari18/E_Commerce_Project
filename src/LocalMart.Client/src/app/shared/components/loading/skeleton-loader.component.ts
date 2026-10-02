import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'card' | 'detail' | 'table' | 'text';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [attr.aria-busy]="true" aria-label="Loading content">
      
      <!-- Card Grid Skeleton -->
      <div *ngIf="type === 'card'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div *ngFor="let i of countArray" class="bg-lm-surface-elevated/50 border border-lm-border rounded-2xl p-6 h-64 animate-pulse"></div>
      </div>

      <!-- Detail Hero Skeleton -->
      <div *ngIf="type === 'detail'" class="space-y-8 animate-pulse">
        <div class="h-4 bg-lm-surface-elevated rounded-xl w-1/3"></div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div class="h-96 bg-lm-surface-elevated rounded-3xl border border-lm-border"></div>
          <div class="space-y-6">
            <div class="h-6 bg-lm-surface-elevated rounded-xl w-1/4"></div>
            <div class="h-10 bg-lm-surface-elevated rounded-xl w-3/4"></div>
            <div class="h-6 bg-lm-surface-elevated rounded-xl w-1/3"></div>
            <div class="h-12 bg-lm-surface-elevated rounded-2xl w-1/2"></div>
            <div class="h-24 bg-lm-surface-elevated rounded-2xl"></div>
          </div>
        </div>
      </div>

      <!-- Table Skeleton -->
      <div *ngIf="type === 'table'" class="space-y-3 animate-pulse">
        <div *ngFor="let i of countArray" class="h-14 bg-lm-surface-elevated/50 border border-lm-border rounded-xl w-full"></div>
      </div>

      <!-- Text Lines Skeleton -->
      <div *ngIf="type === 'text'" class="space-y-2 animate-pulse">
        <div *ngFor="let i of countArray" class="h-4 bg-lm-surface-elevated rounded-lg w-full"></div>
      </div>

    </div>
  `
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'card';
  @Input() count: number = 4;

  get countArray(): number[] {
    return Array.from({ length: this.count }, (_, i) => i + 1);
  }
}

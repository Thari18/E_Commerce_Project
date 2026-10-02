import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 transition-colors duration-200">
      <div class="bg-lm-surface rounded-2xl p-6 border border-lm-border mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <span class="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full mb-2 border border-blue-500/20">Delivery Portal</span>
          <h1 class="text-3xl font-extrabold text-lm-text-main">Delivery Staff Dashboard</h1>
          <p class="text-lm-text-muted text-sm mt-1">Manage order dispatch, pickup, and local delivery tasks</p>
        </div>
        <div class="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-blue-400 font-semibold text-sm">
          Active Status: Ready for Assignments
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-lm-surface/80 p-6 rounded-2xl border border-lm-border shadow-sm">
          <div class="text-lm-text-muted text-sm font-medium">Assigned Tasks</div>
          <div class="text-3xl font-black text-amber-400 mt-2">0</div>
        </div>
        <div class="bg-lm-surface/80 p-6 rounded-2xl border border-lm-border shadow-sm">
          <div class="text-lm-text-muted text-sm font-medium">In Transit</div>
          <div class="text-3xl font-black text-blue-400 mt-2">0</div>
        </div>
        <div class="bg-lm-surface/80 p-6 rounded-2xl border border-lm-border shadow-sm">
          <div class="text-lm-text-muted text-sm font-medium">Completed Today</div>
          <div class="text-3xl font-black text-emerald-400 mt-2">0</div>
        </div>
      </div>

      <div class="bg-lm-surface rounded-2xl border border-lm-border p-6 shadow-xl">
        <h2 class="text-lg font-bold text-lm-text-main mb-4">Delivery Assignments</h2>
        <div class="p-8 text-center bg-lm-surface-elevated/40 rounded-xl border border-dashed border-lm-border">
          <svg class="w-12 h-12 mx-auto text-lm-text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-lm-text-muted text-sm font-medium">No active delivery assignments at the moment.</p>
          <p class="text-lm-text-muted text-xs mt-1">Assignments dispatched by vendors/admins will appear here in real-time.</p>
        </div>
      </div>
    </div>
  `
})
export class DeliveryDashboardComponent {}


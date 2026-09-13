import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-8 flex justify-between items-center">
        <div>
          <span class="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full mb-2">Delivery Portal</span>
          <h1 class="text-3xl font-extrabold text-white">Delivery Staff Dashboard</h1>
          <p class="text-slate-400 text-sm mt-1">Manage order dispatch, pickup, and local delivery tasks</p>
        </div>
        <div class="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-400 font-medium text-sm">
          Active Status: Ready for Assignments
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <div class="text-slate-400 text-sm">Assigned Tasks</div>
          <div class="text-3xl font-black text-amber-400 mt-2">0</div>
        </div>
        <div class="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <div class="text-slate-400 text-sm">In Transit</div>
          <div class="text-3xl font-black text-blue-400 mt-2">0</div>
        </div>
        <div class="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <div class="text-slate-400 text-sm">Completed Today</div>
          <div class="text-3xl font-black text-emerald-400 mt-2">0</div>
        </div>
      </div>

      <div class="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
        <h2 class="text-lg font-bold text-white mb-4">Delivery Assignments</h2>
        <div class="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          <svg class="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-slate-400 text-sm font-medium">No active delivery assignments at the moment.</p>
          <p class="text-slate-500 text-xs mt-1">Assignments dispatched by vendors/admins will appear here in real-time.</p>
        </div>
      </div>
    </div>
  `
})
export class DeliveryDashboardComponent {}

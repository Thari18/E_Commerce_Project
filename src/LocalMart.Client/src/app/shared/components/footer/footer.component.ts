import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-lm-surface text-lm-text-muted border-t border-lm-border py-8 mt-16 transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="text-sm">
          <p class="font-bold text-lm-text-main">LocalMart — Location-Aware Multi-Vendor Marketplace</p>
          <p class="text-xs text-lm-text-muted mt-1">Connecting local vendors, customers, and delivery partners.</p>
        </div>
        <div class="text-xs text-lm-text-muted">
          © 2026 LocalMart. All rights reserved. ASP.NET Core .NET 8 & Angular Architecture.
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}


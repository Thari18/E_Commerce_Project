import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/auth.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-lm-surface border border-lm-border hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-lm-glow transition-all duration-300 group flex flex-col h-full">
      <a [routerLink]="['/products', product.slug || product.id]" class="relative aspect-video bg-lm-surface-elevated overflow-hidden block cursor-pointer">
        <img [src]="product.imageUrl" [alt]="product.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span class="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur shadow-md">
          {{ product.status }}
        </span>
      </a>
      <div class="p-5 flex flex-col flex-grow">
        <span class="text-xs text-blue-500 font-bold tracking-wide uppercase">{{ product.vendorName }}</span>
        <a [routerLink]="['/products', product.slug || product.id]" class="hover:underline">
          <h3 class="text-lg font-bold text-lm-text-main mt-1 group-hover:text-blue-400 transition-colors">{{ product.name }}</h3>
        </a>
        <p class="text-lm-text-muted text-xs mt-2 line-clamp-2 flex-grow">{{ product.description }}</p>
        <div class="mt-4 pt-3 border-t border-lm-border flex items-center justify-between">
          <div class="text-xl font-extrabold text-lm-text-main">
            {{ product.price | number:'1.2-2' }}
          </div>
          <button [routerLink]="['/products', product.slug || product.id]" class="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 hover:scale-105">
            View Detail
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
}


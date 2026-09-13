import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/auth.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-emerald-500/50 transition-all duration-300 group flex flex-col h-full">
      <div class="relative aspect-video bg-slate-800 overflow-hidden">
        <img [src]="product.imageUrl" [alt]="product.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span class="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-slate-950 backdrop-blur shadow">
          {{ product.status }}
        </span>
      </div>
      <div class="p-5 flex flex-col flex-grow">
        <span class="text-xs text-emerald-400 font-semibold tracking-wide uppercase">{{ product.vendorName }}</span>
        <h3 class="text-lg font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">{{ product.name }}</h3>
        <p class="text-slate-400 text-xs mt-2 line-clamp-2 flex-grow">{{ product.description }}</p>
        <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div class="text-xl font-extrabold text-white">
            {{ product.price | number:'1.2-2' }}
          </div>
          <button class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow hover:scale-105">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
}

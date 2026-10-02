import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  show(type: ToastType, message: string, title?: string, duration: number = 4000): string {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message, duration };

    this.toasts.update(current => [...current.slice(-4), toast]); // Max 5 visible

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(message: string, title?: string, duration?: number): string {
    return this.show('success', message, title, duration);
  }

  error(message: string, title?: string, duration?: number): string {
    return this.show('error', message, title, duration);
  }

  info(message: string, title?: string, duration?: number): string {
    return this.show('info', message, title, duration);
  }

  warning(message: string, title?: string, duration?: number): string {
    return this.show('warning', message, title, duration);
  }

  dismiss(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}

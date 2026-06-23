import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

const DISMISS_MS: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  info: 4000,
};

@Injectable({ providedIn: 'root' })
export class NutriToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(message: string, variant: ToastVariant): void {
    const id = crypto.randomUUID();
    const toast: ToastMessage = { id, message, variant };
    this.toasts.update((list) => [...list, toast]);
    const timer = setTimeout(() => this.dismiss(id), DISMISS_MS[variant]);
    this.timers.set(id, timer);
  }
}

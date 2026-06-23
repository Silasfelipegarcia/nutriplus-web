import { Component, inject } from '@angular/core';
import { NutriToastService } from './nutri-toast.service';

@Component({
  selector: 'nutri-toast-container',
  standalone: true,
  template: `
    <div class="nutri-toast-stack" aria-live="polite" aria-relevant="additions">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="nutri-toast nutri-toast--{{ toast.variant }}"
          role="status"
          (click)="toastService.dismiss(toast.id)"
        >
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styleUrl: './nutri-toast-container.component.scss',
})
export class NutriToastContainerComponent {
  readonly toastService = inject(NutriToastService);
}

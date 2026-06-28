import { Component, input } from '@angular/core';

@Component({
  selector: 'app-portal-page-skeleton',
  standalone: true,
  template: `
    <div class="portal-page-skeleton" [attr.aria-label]="ariaLabel()" role="status">
      <div class="portal-page-skeleton__hero"></div>
      @for (i of cardSlots(); track i) {
        <div class="portal-page-skeleton__card"></div>
      }
      @for (i of rowSlots(); track i) {
        <div class="portal-page-skeleton__row"></div>
      }
    </div>
  `,
  styleUrl: '../portal.scss',
})
export class PortalPageSkeletonComponent {
  readonly cards = input(2);
  readonly rows = input(2);
  readonly ariaLabel = input('Carregando conteúdo');

  cardSlots(): number[] {
    return Array.from({ length: this.cards() }, (_, i) => i);
  }

  rowSlots(): number[] {
    return Array.from({ length: this.rows() }, (_, i) => i);
  }
}

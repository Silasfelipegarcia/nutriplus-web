import { Component, Input } from '@angular/core';

@Component({
  selector: 'nutri-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <div class="empty-state__icon" aria-hidden="true">{{ icon }}</div>
      <h3 class="empty-state__title">{{ title }}</h3>
      <p class="empty-state__text">{{ message }}</p>
      <ng-content />
    </div>
  `,
  styleUrl: './nutri-empty-state.component.scss',
})
export class NutriEmptyStateComponent {
  @Input() icon = '📋';
  @Input() title = 'Nada por aqui ainda';
  @Input() message = '';
}

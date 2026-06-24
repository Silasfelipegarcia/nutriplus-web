import { Component, Input } from '@angular/core';

@Component({
  selector: 'nutri-stat-card',
  standalone: true,
  template: `
    <div class="nutri-stat-card">
      <strong class="nutri-stat-card__value">{{ value }}</strong>
      <span class="nutri-stat-card__label">{{ label }}</span>
    </div>
  `,
  styleUrl: './nutri-stat-card.component.scss',
})
export class NutriStatCardComponent {
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) label!: string;
}

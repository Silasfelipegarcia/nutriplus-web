import { Component, Input } from '@angular/core';

@Component({
  selector: 'nutri-badge',
  standalone: true,
  template: `
    <span class="nutri-badge" [class]="'nutri-badge--' + variant">
      <ng-content />
    </span>
  `,
  styleUrl: './nutri-badge.component.scss',
})
export class NutriBadgeComponent {
  @Input() variant: 'verified' | 'pending' | 'active' = 'active';
}

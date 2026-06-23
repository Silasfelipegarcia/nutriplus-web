import { Component, Input } from '@angular/core';

@Component({
  selector: 'nutri-card',
  standalone: true,
  template: `
    <div class="nutri-card" [class.nutri-card--hover]="hover">
      @if (title) {
        <h3 class="nutri-card__title">{{ title }}</h3>
      }
      <div class="nutri-card__body">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './nutri-card.component.scss',
})
export class NutriCardComponent {
  @Input() title = '';
  @Input() hover = false;
}

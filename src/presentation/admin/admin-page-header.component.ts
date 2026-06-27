import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-page-header',
  standalone: true,
  template: `
    <header class="admin-content__header">
      <div>
        @if (eyebrow) {
          <p class="admin-content__eyebrow">{{ eyebrow }}</p>
        }
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="admin-content__subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="admin-content__actions">
        <ng-content />
      </div>
    </header>
  `,
})
export class AdminPageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() eyebrow = 'Admin';
}

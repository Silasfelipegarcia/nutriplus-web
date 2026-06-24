import { Component, Input } from '@angular/core';

@Component({
  selector: 'nutri-section',
  standalone: true,
  template: `
    <section class="nutri-section">
      <div class="nutri-section__header">
        <div>
          <h2 class="nutri-section__title">{{ title }}</h2>
          @if (description) {
            <p class="nutri-section__description">{{ description }}</p>
          }
        </div>
        <div class="nutri-section__action">
          <ng-content select="[sectionAction]" />
        </div>
      </div>
      <ng-content />
    </section>
  `,
  styleUrl: './nutri-section.component.scss',
})
export class NutriSectionComponent {
  @Input({ required: true }) title!: string;
  @Input() description = '';
}

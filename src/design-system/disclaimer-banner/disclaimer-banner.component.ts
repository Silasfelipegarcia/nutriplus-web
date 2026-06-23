import { Component, Input } from '@angular/core';
import { DISCLAIMER } from '../../presentation/core/constants';

@Component({
  selector: 'nutri-disclaimer',
  standalone: true,
  template: `
    <div class="disclaimer-banner" role="note">
      <span class="disclaimer-banner__icon" aria-hidden="true">ℹ️</span>
      <span>{{ text }}</span>
    </div>
  `,
  styleUrl: './disclaimer-banner.component.scss',
})
export class DisclaimerBannerComponent {
  @Input() text = DISCLAIMER;
}

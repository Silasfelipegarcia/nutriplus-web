import { Component } from '@angular/core';
import { NutriAiLinkComponent } from '../nutri-ai-link/nutri-ai-link.component';

@Component({
  selector: 'nutri-disclaimer',
  standalone: true,
  imports: [NutriAiLinkComponent],
  template: `<nutri-ai-link />`,
})
export class DisclaimerBannerComponent {}

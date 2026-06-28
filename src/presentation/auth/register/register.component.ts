import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { BetaSignupFormComponent } from '../beta-signup-form/beta-signup-form.component';
import { APP_NAME } from '../../core/constants';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, NutriLogoComponent, BetaSignupFormComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__logo"><nutri-logo /></div>
        <p class="auth-card__footer">
          <a routerLink="/">Saiba mais sobre o {{ appName }}</a>
          · <a routerLink="/beta">Participar do beta</a>
        </p>
        <app-beta-signup-form analyticsLocation="signup_page" />
      </div>
    </div>
  `,
  styleUrl: '../auth-layout.scss',
})
export class RegisterComponent {
  readonly appName = APP_NAME;
}

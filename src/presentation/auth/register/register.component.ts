import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { BetaSignupFormComponent } from '../beta-signup-form/beta-signup-form.component';
import { FeatureFlagService } from '../../../infrastructure/http/feature-flag.service';
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
          @if (registrationOpen() === false) {
            · <a routerLink="/beta" class="beta-cta-link">Participar do beta</a>
          }
        </p>
        <app-beta-signup-form analyticsLocation="signup_page" />
      </div>
    </div>
  `,
  styleUrl: '../auth-layout.scss',
})
export class RegisterComponent implements OnInit {
  readonly appName = APP_NAME;
  readonly registrationOpen = signal<boolean | null>(null);

  private readonly featureFlags = inject(FeatureFlagService);

  ngOnInit(): void {
    this.syncRegistrationFlag();
    void this.featureFlags.prefetch().then(() => this.syncRegistrationFlag());
  }

  private syncRegistrationFlag(): void {
    this.registrationOpen.set(this.featureFlags.isRegistrationOpenSync());
  }
}

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { DisclaimerBannerComponent } from '../../../design-system/disclaimer-banner/disclaimer-banner.component';
import { TERMS_BODY } from '../../core/constants';
import { AuthFacade } from '../../core/auth.facade';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-onboarding-terms',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent, DisclaimerBannerComponent],
  template: `
    <div class="onboarding">
      <div class="onboarding__card">
        <h1>Termos de uso e IA</h1>
        <p class="onboarding__lead">Leia e aceite para continuar.</p>
        <div class="terms-box">{{ termsBody }}</div>
        <nutri-disclaimer />
        <label class="terms-check">
          <input type="checkbox" [(ngModel)]="accepted" />
          <span>Li e aceito os termos de uso, política de privacidade e o aviso sobre IA.</span>
        </label>
        @if (error) {
          <div class="auth-card__error">{{ error }}</div>
        }
        <div class="onboarding__actions">
          <nutri-button variant="primary" [disabled]="!accepted || saving" (click)="submit()">
            {{ saving ? 'Salvando...' : 'Aceitar e continuar' }}
          </nutri-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../onboarding.scss',
})
export class OnboardingTermsComponent {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  readonly termsBody = TERMS_BODY;
  accepted = false;
  saving = false;
  error: string | null = null;

  async submit(): Promise<void> {
    this.saving = true;
    this.error = null;
    try {
      await this.auth.acceptTerms(environment.termsVersion, environment.privacyVersion);
      this.router.navigate(['/app/dashboard']);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Erro ao aceitar termos';
    } finally {
      this.saving = false;
    }
  }
}

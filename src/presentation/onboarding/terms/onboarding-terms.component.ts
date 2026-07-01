import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { APP_COPY } from '../../core/app-copy';
import { HEALTH_ELIGIBILITY_SUMMARY, TERMS_BODY } from '../../core/constants';
import { AuthFacade } from '../../core/auth.facade';
import { environment } from '../../../environments/environment';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

@Component({
  selector: 'app-onboarding-terms',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent],
  template: `
    <div class="onboarding">
      <div class="onboarding__card">
        <h1>Termos de uso e IA</h1>
        <p class="onboarding__lead">Leia e aceite para continuar.</p>
        <div class="terms-box">{{ termsBody }}</div>
        <label class="terms-check">
          <input type="checkbox" [(ngModel)]="acceptedTerms" />
          <span>{{ termsCheckboxLabel }}</span>
        </label>
        <label class="terms-check">
          <input type="checkbox" [(ngModel)]="acceptedHealthEligibility" />
          <span>{{ healthEligibilityCheckboxLabel }}</span>
        </label>
        @if (error) {
          <div class="auth-card__error">{{ error }}</div>
        }
        <div class="onboarding__actions">
          <nutri-button
            variant="primary"
            [disabled]="!acceptedTerms || !acceptedHealthEligibility || saving"
            (click)="submit()"
          >
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
  private readonly toast = inject(NutriToastService);
  private readonly analytics = inject(AnalyticsService);

  readonly termsBody = `${TERMS_BODY}\n\n${HEALTH_ELIGIBILITY_SUMMARY}`;
  readonly termsCheckboxLabel = APP_COPY.termsCheckboxShort;
  readonly healthEligibilityCheckboxLabel = APP_COPY.healthEligibilityCheckboxShort;
  acceptedTerms = false;
  acceptedHealthEligibility = false;
  saving = false;
  error: string | null = null;

  async submit(): Promise<void> {
    this.saving = true;
    this.error = null;
    try {
      await this.auth.acceptTerms({
        termsVersion: environment.termsVersion,
        privacyVersion: environment.privacyVersion,
        healthEligibilityVersion: environment.healthEligibilityVersion,
        healthEligibilityAccepted: this.acceptedHealthEligibility,
      });
      this.analytics.trackOnboardingCompleted();
      this.toast.success('Perfil configurado!');
      setTimeout(() => this.router.navigate(['/app/dashboard']), 800);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Erro ao aceitar termos';
    } finally {
      this.saving = false;
    }
  }
}

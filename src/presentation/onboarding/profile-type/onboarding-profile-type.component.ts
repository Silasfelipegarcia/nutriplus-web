import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { OnboardingDraftService } from '../onboarding-draft.service';
import { APP_NAME } from '../../core/constants';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

@Component({
  selector: 'app-onboarding-profile-type',
  standalone: true,
  imports: [RouterLink, NutriButtonComponent],
  template: `
    <div class="onboarding">
      <div class="onboarding__card">
        <p class="onboarding__step">Passo 2 de 8</p>
        <h1>Seu perfil</h1>
        <p class="onboarding__lead">Como você quer usar o {{ appName }}?</p>
        <div class="agent-options">
          <button
            type="button"
            class="agent-option"
            [class.agent-option--selected]="!athlete"
            (click)="select(false)"
          >
            <h3>Uso geral</h3>
            <p>Organização alimentar do dia a dia.</p>
          </button>
          <button
            type="button"
            class="agent-option"
            [class.agent-option--selected]="athlete"
            (click)="select(true)"
          >
            <h3>Modo atleta</h3>
            <p>Treinos e ajuste de macros.</p>
          </button>
        </div>
        <div class="onboarding__actions">
          <nutri-button variant="ghost" to="/onboarding">Voltar</nutri-button>
          <nutri-button variant="primary" (click)="continue()">Continuar</nutri-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../onboarding.scss',
})
export class OnboardingProfileTypeComponent {
  readonly appName = APP_NAME;
  private readonly draft = inject(OnboardingDraftService);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  athlete = this.draft.draft().athleteModeEnabled;

  select(athlete: boolean): void {
    this.athlete = athlete;
    this.draft.update({
      athleteModeEnabled: athlete,
      activities: athlete ? this.draft.draft().activities : [],
    });
  }

  continue(): void {
    this.draft.update({ athleteModeEnabled: this.athlete });
    this.analytics.trackOnboardingProfileType(this.athlete);
    this.analytics.trackOnboardingStepCompleted('onboarding_type');
    if (this.athlete) {
      this.router.navigate(['/onboarding/treino']);
    } else {
      this.router.navigate(['/onboarding/preferencias']);
    }
  }
}

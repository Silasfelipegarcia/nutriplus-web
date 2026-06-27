import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { OnboardingDraftService } from '../onboarding-draft.service';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

@Component({
  selector: 'app-onboarding-diet',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent, NutriInfoTipComponent],
  template: `
    <div class="onboarding">
      <form class="onboarding__card" (ngSubmit)="continue()">
        <p class="onboarding__step">Passo {{ stepLabel }} de 8</p>
        <h1>Dieta e restrições</h1>
        <p class="onboarding__lead">Defina o estilo alimentar que a IA deve respeitar no plano.</p>
        <nutri-info-tip
          message="Restrições de lactose e glúten são validadas automaticamente no plano e na lista de compras."
        />
        <div class="form-grid">
          <div>
            <label class="field-label">Estilo alimentar</label>
            <select class="nutri-select" [(ngModel)]="dietaryPreference" name="diet">
              <option value="OMNIVORE">Onívoro</option>
              <option value="VEGETARIAN">Vegetariano</option>
              <option value="VEGAN">Vegano</option>
            </select>
          </div>
          <div>
            <label class="field-label">Restrição</label>
            <select class="nutri-select" [(ngModel)]="restriction" name="restriction">
              <option value="NONE">Nenhuma</option>
              <option value="LACTOSE">Sem lactose</option>
              <option value="GLUTEN">Sem glúten</option>
              <option value="LACTOSE_GLUTEN">Sem lactose e glúten</option>
            </select>
          </div>
        </div>
        <div class="onboarding__actions">
          <nutri-button variant="ghost" type="button" to="/onboarding/metricas">Voltar</nutri-button>
          <nutri-button variant="primary" type="submit">Continuar</nutri-button>
        </div>
      </form>
    </div>
  `,
  styleUrl: '../onboarding.scss',
})
export class OnboardingDietComponent {
  private readonly draft = inject(OnboardingDraftService);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  dietaryPreference = this.draft.draft().dietaryPreference;
  restriction = this.draft.draft().restriction;

  get stepLabel(): string {
    return this.draft.draft().athleteModeEnabled ? '6' : '5';
  }

  continue(): void {
    this.draft.update({
      dietaryPreference: this.dietaryPreference,
      restriction: this.restriction,
    });
    this.analytics.trackOnboardingStepCompleted('onboarding_diet');
    void this.router.navigate(['/onboarding/saude']);
  }
}

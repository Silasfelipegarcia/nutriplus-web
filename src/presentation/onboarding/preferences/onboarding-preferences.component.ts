import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { OnboardingDraftService } from '../onboarding-draft.service';

const BUDGET_OPTIONS = [
  { value: 'ECONOMIC', label: 'Econômico', subtitle: 'Prioriza custo baixo — frango, ovos, tilápia, legumes da estação.' },
  { value: 'MODERATE', label: 'Moderado', subtitle: 'Equilíbrio entre preço e variedade.' },
  { value: 'FLEXIBLE', label: 'Flexível', subtitle: 'Mais liberdade — itens premium quando couber.' },
] as const;

@Component({
  selector: 'app-onboarding-preferences',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent, NutriInputComponent, NutriInfoTipComponent],
  template: `
    <div class="onboarding">
      <form class="onboarding__card" (ngSubmit)="continue()">
        <p class="onboarding__step">Passo {{ stepLabel }} de 8</p>
        <h1>Preferências alimentares</h1>
        <p class="onboarding__lead">Ajude a IA a personalizar seu plano com o que você gosta e evita.</p>
        <nutri-info-tip
          message="Quanto mais contexto você der, melhor a IA monta refeições que você realmente vai comer."
        />
        <div class="form-grid form-grid--full">
          <div class="form-grid--full">
            <label class="field-label">Orçamento alimentar</label>
            <div class="agent-options">
              @for (opt of budgetOptions; track opt.value) {
                <button
                  type="button"
                  class="agent-option"
                  [class.agent-option--selected]="budget === opt.value"
                  (click)="budget = opt.value"
                >
                  <h3>{{ opt.label }}</h3>
                  <p>{{ opt.subtitle }}</p>
                </button>
              }
            </div>
          </div>
        </div>
        <nutri-input
          label="Alimentos que você gosta"
          type="textarea"
          [(ngModel)]="likes"
          name="likes"
          placeholder="Ex: frango, arroz integral, abacate..."
        />
        <nutri-input
          label="Alimentos que evita"
          type="textarea"
          [(ngModel)]="dislikes"
          name="dislikes"
          placeholder="Ex: fígado, jiló..."
        />
        <nutri-input
          label="Observações sobre refeições"
          type="textarea"
          [(ngModel)]="notes"
          name="notes"
          placeholder="Ex: prefiro café da manhã leve..."
        />
        <div class="onboarding__actions">
          <nutri-button variant="ghost" type="button" [to]="backLink">Voltar</nutri-button>
          <nutri-button variant="primary" type="submit">Continuar</nutri-button>
        </div>
      </form>
    </div>
  `,
  styleUrl: '../onboarding.scss',
})
export class OnboardingPreferencesComponent {
  private readonly draft = inject(OnboardingDraftService);
  private readonly router = inject(Router);
  readonly budgetOptions = BUDGET_OPTIONS;
  likes = this.draft.draft().foodLikes;
  dislikes = this.draft.draft().foodDislikes;
  notes = this.draft.draft().mealNotes;
  budget = this.draft.draft().foodBudgetLevel;

  get stepLabel(): string {
    return this.draft.draft().athleteModeEnabled ? '4' : '3';
  }

  get backLink(): string {
    return this.draft.draft().athleteModeEnabled ? '/onboarding/treino' : '/onboarding/tipo';
  }

  continue(): void {
    this.draft.update({
      foodLikes: this.likes,
      foodDislikes: this.dislikes,
      mealNotes: this.notes,
      foodBudgetLevel: this.budget,
    });
    void this.router.navigate(['/onboarding/metricas']);
  }
}

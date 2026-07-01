import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriMealRoutinePickerComponent } from '../../../design-system/nutri-meal-routine-picker/nutri-meal-routine-picker.component';
import { hasAnyMealRoutine, MealRoutineState } from '../../core/meal-routine';
import { OnboardingDraftService } from '../onboarding-draft.service';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

const BUDGET_OPTIONS = [
  { value: 'ECONOMIC', label: 'Econômico' },
  { value: 'MODERATE', label: 'Moderado' },
  { value: 'FLEXIBLE', label: 'Flexível' },
] as const;

@Component({
  selector: 'app-onboarding-preferences',
  standalone: true,
  imports: [
    FormsModule,
    NutriButtonComponent,
    NutriInputComponent,
    NutriMealRoutinePickerComponent,
  ],
  template: `
    <div class="onboarding">
      <form class="onboarding__card" (ngSubmit)="continue()">
        <p class="onboarding__step">Passo {{ stepLabel }} de 8</p>
        <h1>Preferências alimentares</h1>
        <p class="onboarding__lead">O que você gosta e evita.</p>
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

        <nutri-meal-routine-picker [value]="mealRoutine" (valueChange)="mealRoutine = $event" />

        <nutri-input
          label="Algo mais? (opcional)"
          type="textarea"
          [(ngModel)]="notes"
          name="notes"
          placeholder="Ex.: marmita no almoço, trabalho em home office..."
        />

        @if (validationError) {
          <p class="onboarding__error">{{ validationError }}</p>
        }

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
  private readonly analytics = inject(AnalyticsService);
  readonly budgetOptions = BUDGET_OPTIONS;
  likes = this.draft.draft().foodLikes;
  dislikes = this.draft.draft().foodDislikes;
  notes = this.draft.draft().mealNotes;
  budget = this.draft.draft().foodBudgetLevel;
  mealRoutine: MealRoutineState = this.mealRoutineFromDraft();
  validationError = '';

  get stepLabel(): string {
    return this.draft.draft().athleteModeEnabled ? '4' : '3';
  }

  get backLink(): string {
    return this.draft.draft().athleteModeEnabled ? '/onboarding/treino' : '/onboarding/tipo';
  }

  private mealRoutineFromDraft(): MealRoutineState {
    const d = this.draft.draft();
    return {
      eatsBreakfast: d.eatsBreakfast,
      eatsLunch: d.eatsLunch,
      eatsAfternoonSnack: d.eatsAfternoonSnack,
      eatsDinner: d.eatsDinner,
      openToRoutineAdjustment: d.openToRoutineAdjustment,
      freeExtras: [...d.freeExtras],
    };
  }

  continue(): void {
    this.validationError = '';
    if (!hasAnyMealRoutine(this.mealRoutine)) {
      this.validationError = 'Marque pelo menos uma refeição da sua rotina.';
      return;
    }
    this.draft.update({
      foodLikes: this.likes,
      foodDislikes: this.dislikes,
      mealNotes: this.notes,
      foodBudgetLevel: this.budget,
      ...this.mealRoutine,
    });
    this.analytics.trackOnboardingStepCompleted('onboarding_preferences');
    void this.router.navigate(['/onboarding/metricas']);
  }
}

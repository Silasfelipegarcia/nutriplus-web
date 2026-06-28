import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { NutriMealRoutinePickerComponent } from '../../../../design-system/nutri-meal-routine-picker/nutri-meal-routine-picker.component';
import { hasAnyMealRoutine, MealRoutineState } from '../../../core/meal-routine';
import { OnboardingDraftService } from '../../../onboarding/onboarding-draft.service';
import { ProfileEditService } from '../profile-edit.service';
import { NutriToastService } from '../../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../../core/action-feedback';

const BUDGET_OPTIONS = [
  { value: 'ECONOMIC', label: 'Econômico', subtitle: 'Prioriza custo baixo — frango, ovos, tilápia, legumes da estação.' },
  { value: 'MODERATE', label: 'Moderado', subtitle: 'Equilíbrio entre preço e variedade.' },
  { value: 'FLEXIBLE', label: 'Flexível', subtitle: 'Mais liberdade — itens premium quando couber.' },
] as const;

@Component({
  selector: 'app-profile-edit-preferences',
  standalone: true,
  imports: [
    FormsModule,
    NutriButtonComponent,
    NutriInputComponent,
    NutriInfoTipComponent,
    NutriMealRoutinePickerComponent,
  ],
  template: `
    <div class="portal-page">
      <div class="portal-card">
        @if (profileEdit.loading()) {
          <p class="loading-text">Carregando...</p>
        } @else {
          <form (ngSubmit)="save()">
            <h1 class="portal-section__title">Preferências alimentares</h1>
            <p class="portal-card__lead">
              Atualize o que você gosta, evita e sua rotina de refeições.
            </p>
            <nutri-info-tip
              message="Quanto mais contexto você der, melhor a IA monta refeições que você realmente vai comer."
            />
            <div class="form-grid form-grid--full" style="margin-top: 1rem">
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
              placeholder="Ex: banana, fígado, jiló..."
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
              <p class="auth-card__error">{{ validationError }}</p>
            }
            <div class="portal-actions">
              <nutri-button variant="ghost" type="button" to="/app/perfil">Cancelar</nutri-button>
              <nutri-button variant="primary" type="submit" [disabled]="saving">
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </nutri-button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styleUrls: ['../../portal.scss', '../../../onboarding/onboarding.scss'],
})
export class ProfileEditPreferencesComponent implements OnInit {
  readonly profileEdit = inject(ProfileEditService);
  private readonly draft = inject(OnboardingDraftService);
  private readonly router = inject(Router);
  private readonly toast = inject(NutriToastService);

  readonly budgetOptions = BUDGET_OPTIONS;
  likes = '';
  dislikes = '';
  notes = '';
  budget = 'MODERATE';
  mealRoutine: MealRoutineState = {
    eatsBreakfast: true,
    eatsLunch: true,
    eatsAfternoonSnack: false,
    eatsDinner: true,
    openToRoutineAdjustment: false,
    freeExtras: [],
  };
  validationError = '';
  saving = false;

  async ngOnInit(): Promise<void> {
    await this.profileEdit.bootstrap(true);
    this.loadFromDraft();
  }

  private loadFromDraft(): void {
    const d = this.draft.draft();
    this.likes = d.foodLikes;
    this.dislikes = d.foodDislikes;
    this.notes = d.mealNotes;
    this.budget = d.foodBudgetLevel;
    this.mealRoutine = {
      eatsBreakfast: d.eatsBreakfast,
      eatsLunch: d.eatsLunch,
      eatsAfternoonSnack: d.eatsAfternoonSnack,
      eatsDinner: d.eatsDinner,
      openToRoutineAdjustment: d.openToRoutineAdjustment,
      freeExtras: [...d.freeExtras],
    };
  }

  async save(): Promise<void> {
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

    this.saving = true;
    const ok = await withActionFeedback(
      this.toast,
      async () => {
        await this.profileEdit.save();
        await this.router.navigate(['/app/perfil']);
      },
      { success: 'Perfil atualizado.' },
    );
    this.saving = false;
    if (!ok) return;
  }
}

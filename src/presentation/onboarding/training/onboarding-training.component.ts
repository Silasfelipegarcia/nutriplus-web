import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { NutriSportPickerComponent } from '../../../design-system/nutri-sport-picker/nutri-sport-picker.component';
import { OnboardingDraftService } from '../onboarding-draft.service';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { OnboardingActivityDraft, SportCatalogItem } from '../../../domain/entities';
import { SportSelection } from '../../core/sport-catalog';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

@Component({
  selector: 'app-onboarding-training',
  standalone: true,
  imports: [
    FormsModule,
    NutriButtonComponent,
    NutriInputComponent,
    NutriInfoTipComponent,
    NutriSportPickerComponent,
  ],
  template: `
    <div class="onboarding">
      <div class="onboarding__card onboarding__card--wide">
        <p class="onboarding__step">Passo 3 de 8</p>
        <h1>Seus treinos</h1>
        <p class="onboarding__lead">Cadastre pelo menos uma atividade para ajustar calorias no plano.</p>
        <nutri-info-tip
          message="Usamos dias por semana e duração para estimar o gasto extra. Você poderá editar depois em Treino."
        />
        @if (error) {
          <div class="auth-card__error">{{ error }}</div>
        }
        <div class="form-grid">
          <div class="form-grid--full">
            <label class="field-label" for="sport">Esporte</label>
            <nutri-sport-picker
              id="sport"
              [catalog]="sports()"
              [(ngModel)]="sportSelection"
              name="sport"
            />
          </div>
          <nutri-input label="Dias por semana" type="number" [(ngModel)]="daysPerWeekStr" name="days" />
          <nutri-input label="Minutos por sessão" type="number" [(ngModel)]="minutesPerSessionStr" name="minutes" />
        </div>
        <div class="onboarding__actions onboarding__actions--inline">
          <nutri-button variant="secondary" (click)="addActivity()">Adicionar atividade</nutri-button>
        </div>
        @if (activities.length) {
          <div class="onboarding-activity-list">
            @for (a of activities; track activityKey(a)) {
              <div class="onboarding-activity-item">
                <div>
                  <strong>{{ activityLabel(a) }}</strong>
                  <span>{{ a.daysPerWeek }}x/semana · {{ a.minutesPerSession }} min</span>
                </div>
                <nutri-button variant="ghost" size="sm" (click)="removeActivity(a)">Remover</nutri-button>
              </div>
            }
          </div>
        }
        <div class="onboarding__actions">
          <nutri-button variant="ghost" to="/onboarding/tipo">Voltar</nutri-button>
          <nutri-button variant="primary" (click)="continue()">Continuar</nutri-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../onboarding.scss',
})
export class OnboardingTrainingComponent implements OnInit {
  private readonly draft = inject(OnboardingDraftService);
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  readonly sports = signal<SportCatalogItem[]>([]);
  sportSelection: SportSelection | null = null;
  daysPerWeekStr = '3';
  minutesPerSessionStr = '60';
  activities: OnboardingActivityDraft[] = [...this.draft.draft().activities];
  error: string | null = null;

  async ngOnInit(): Promise<void> {
    this.sports.set(await this.nutritionRepo.getSportCatalog());
  }

  activityLabel(a: OnboardingActivityDraft): string {
    return a.customLabel?.trim() || a.label;
  }

  activityKey(a: OnboardingActivityDraft): string {
    return a.customLabel ? `${a.sportType}:${a.customLabel}` : a.sportType;
  }

  addActivity(): void {
    const sel = this.sportSelection;
    if (!sel) {
      this.error = 'Selecione ou digite um esporte.';
      return;
    }
    const draft: OnboardingActivityDraft = {
      sportType: sel.sportType,
      label: sel.label,
      customLabel: sel.customLabel,
      daysPerWeek: Math.min(7, Math.max(1, Number(this.daysPerWeekStr) || 3)),
      minutesPerSession: Math.max(15, Number(this.minutesPerSessionStr) || 60),
    };
    if (this.activities.some((a) => this.activityKey(a) === this.activityKey(draft))) {
      this.error = 'Esta atividade já foi adicionada.';
      return;
    }
    this.activities.push(draft);
    this.sportSelection = null;
    this.error = null;
  }

  removeActivity(activity: OnboardingActivityDraft): void {
    const key = this.activityKey(activity);
    this.activities = this.activities.filter((a) => this.activityKey(a) !== key);
  }

  continue(): void {
    if (!this.activities.length) {
      this.error = 'Adicione pelo menos um treino para continuar.';
      return;
    }
    this.draft.update({ activities: [...this.activities], athleteModeEnabled: true });
    this.analytics.trackOnboardingStepCompleted('onboarding_training');
    this.router.navigate(['/onboarding/preferencias']);
  }
}

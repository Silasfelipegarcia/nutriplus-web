import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { OnboardingDraftService } from '../onboarding-draft.service';
import { BRAZIL_STATES } from '../../core/brazil-states';
import { computeAgeFromBirthDate, MAX_USER_AGE, MIN_USER_AGE } from '../../core/date.util';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

@Component({
  selector: 'app-onboarding-metrics',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent, NutriInputComponent, NutriInfoTipComponent],
  template: `
    <div class="onboarding">
      <form class="onboarding__card" (ngSubmit)="continue()">
        <p class="onboarding__step">Passo {{ stepLabel }} de 8</p>
        <h1>Suas métricas</h1>
        <p class="onboarding__lead">Para calcular macros e metas calóricas.</p>
        <div class="form-grid">
          <nutri-input label="Data de nascimento" type="date" [(ngModel)]="birthDate" name="birthDate" />
          <div>
            <label class="field-label">Sexo</label>
            <select class="nutri-select" [(ngModel)]="sex" name="sex">
              <option value="FEMALE">Feminino</option>
              <option value="MALE">Masculino</option>
            </select>
          </div>
          <nutri-input label="Altura (cm)" type="number" [(ngModel)]="heightCm" name="height" />
          <nutri-input label="Peso atual (kg)" type="number" [(ngModel)]="currentWeightKg" name="weight" />
          <nutri-input label="Peso meta (kg)" type="number" [(ngModel)]="targetWeightKg" name="target" />
          <div>
            <label class="field-label">Objetivo</label>
            <select class="nutri-select" [(ngModel)]="goal" name="goal">
              <option value="LOSE_WEIGHT">Perder peso</option>
              <option value="MAINTAIN_WEIGHT">Manter peso</option>
              <option value="GAIN_MASS">Ganhar massa</option>
            </select>
          </div>
          <nutri-input label="Meta em semanas" type="number" [(ngModel)]="goalTargetWeeks" name="weeks" />
          <div>
            <label class="field-label">Estado</label>
            <select class="nutri-select" [(ngModel)]="stateCode" name="state">
              <option value="">Selecione</option>
              @for (s of states; track s.code) {
                <option [value]="s.code">{{ s.name }}</option>
              }
            </select>
          </div>
          <nutri-input label="Cidade" [(ngModel)]="city" name="city" placeholder="Sua cidade" />
          <div class="form-grid--full">
            <label class="field-label">Nível de atividade basal</label>
            <select class="nutri-select" [(ngModel)]="activityLevel" name="activity">
              <option value="SEDENTARY">Sedentário</option>
              <option value="LIGHT">Leve</option>
              <option value="MODERATE">Moderado</option>
              <option value="INTENSE">Intenso</option>
            </select>
          </div>
        </div>
        @if (showSeniorTip) {
          <nutri-info-tip
            message="Emagrecer rápido pode não ser seguro na sua idade — consulte seu médico. Usaremos déficit moderado."
          />
        }
        @if (validationError) {
          <div class="auth-card__error" role="alert">{{ validationError }}</div>
        }
        <div class="onboarding__actions">
          <nutri-button variant="ghost" type="button" to="/onboarding/preferencias">Voltar</nutri-button>
          <nutri-button variant="primary" type="submit">Continuar</nutri-button>
        </div>
      </form>
    </div>
  `,
  styleUrl: '../onboarding.scss',
})
export class OnboardingMetricsComponent {
  private readonly draft = inject(OnboardingDraftService);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  readonly states = BRAZIL_STATES;
  birthDate = this.draft.draft().birthDate;
  sex = this.draft.draft().sex;
  heightCm = this.draft.draft().heightCm;
  currentWeightKg = this.draft.draft().currentWeightKg;
  targetWeightKg = this.draft.draft().targetWeightKg;
  goal = this.draft.draft().goal;
  goalTargetWeeks = this.draft.draft().goalTargetWeeks;
  activityLevel = this.draft.draft().activityLevel;
  city = this.draft.draft().city;
  stateCode = this.draft.draft().stateCode;
  validationError = '';

  get stepLabel(): string {
    return this.draft.draft().athleteModeEnabled ? '5' : '4';
  }

  get showSeniorTip(): boolean {
    if (!this.birthDate) return false;
    return computeAgeFromBirthDate(this.birthDate) >= 65 && this.goal === 'LOSE_WEIGHT';
  }

  continue(): void {
    if (!this.birthDate) {
      this.validationError = 'Informe sua data de nascimento.';
      return;
    }
    const age = computeAgeFromBirthDate(this.birthDate);
    if (age < MIN_USER_AGE) {
      this.validationError = 'Você precisa ter pelo menos 18 anos.';
      return;
    }
    if (age > MAX_USER_AGE) {
      this.validationError = 'Informe uma data de nascimento válida.';
      return;
    }
    this.validationError = '';
    const seniorWeightLossAck = age >= 65 && this.goal === 'LOSE_WEIGHT';
    this.draft.update({
      birthDate: this.birthDate,
      age,
      sex: this.sex,
      heightCm: this.heightCm,
      currentWeightKg: this.currentWeightKg,
      targetWeightKg: this.targetWeightKg,
      goal: this.goal,
      goalTargetWeeks: Number(this.goalTargetWeeks) || 12,
      activityLevel: this.activityLevel,
      city: this.city.trim(),
      stateCode: this.stateCode,
      seniorWeightLossAck,
    });
    this.analytics.trackOnboardingStepCompleted('onboarding_metrics');
    void this.router.navigate(['/onboarding/dieta']);
  }
}

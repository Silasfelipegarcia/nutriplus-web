import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { BRAZIL_STATES } from '../../../core/brazil-states';
import { computeAgeFromBirthDate, MAX_USER_AGE, MIN_USER_AGE } from '../../../core/date.util';
import { OnboardingDraftService } from '../../../onboarding/onboarding-draft.service';
import { ProfileEditService } from '../profile-edit.service';
import { NutriToastService } from '../../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../../core/action-feedback';

@Component({
  selector: 'app-profile-edit-metrics',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent, NutriInputComponent, NutriInfoTipComponent],
  template: `
    <div class="portal-page">
      <div class="portal-card">
        @if (profileEdit.loading()) {
          <p class="loading-text">Carregando...</p>
        } @else {
          <form (ngSubmit)="save()">
            <h1 class="portal-section__title">Dados pessoais e metas</h1>
            <p class="portal-card__lead">
              Corrija sexo, medidas e objetivos usados nos cálculos metabólicos.
            </p>
            <nutri-info-tip
              message="Peso, altura e data de nascimento entram no cálculo de gasto basal. Cidade e estado ajudam a contextualizar recomendações."
            />
            <div class="form-grid" style="margin-top: 1rem">
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
  styleUrl: '../../portal.scss',
})
export class ProfileEditMetricsComponent implements OnInit {
  readonly profileEdit = inject(ProfileEditService);
  private readonly draft = inject(OnboardingDraftService);
  private readonly router = inject(Router);
  private readonly toast = inject(NutriToastService);

  readonly states = BRAZIL_STATES;
  birthDate = '';
  sex = 'FEMALE';
  heightCm = 165;
  currentWeightKg = 70;
  targetWeightKg = 65;
  goal = 'LOSE_WEIGHT';
  goalTargetWeeks = 12;
  activityLevel = 'MODERATE';
  city = '';
  stateCode = '';
  validationError = '';
  saving = false;

  get showSeniorTip(): boolean {
    if (!this.birthDate) return false;
    return computeAgeFromBirthDate(this.birthDate) >= 65 && this.goal === 'LOSE_WEIGHT';
  }

  async ngOnInit(): Promise<void> {
    await this.profileEdit.bootstrap(true);
    this.loadFromDraft();
  }

  private loadFromDraft(): void {
    const d = this.draft.draft();
    this.birthDate = d.birthDate;
    this.sex = d.sex;
    this.heightCm = d.heightCm;
    this.currentWeightKg = d.currentWeightKg;
    this.targetWeightKg = d.targetWeightKg;
    this.goal = d.goal;
    this.goalTargetWeeks = d.goalTargetWeeks;
    this.activityLevel = d.activityLevel;
    this.city = d.city;
    this.stateCode = d.stateCode;
  }

  async save(): Promise<void> {
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
      seniorWeightLossAck: age >= 65 && this.goal === 'LOSE_WEIGHT',
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

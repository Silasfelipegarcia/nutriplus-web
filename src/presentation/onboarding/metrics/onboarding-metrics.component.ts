import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { OnboardingDraftService } from '../onboarding-draft.service';

@Component({
  selector: 'app-onboarding-metrics',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent, NutriInputComponent, NutriInfoTipComponent],
  template: `
    <div class="onboarding">
      <form class="onboarding__card" (ngSubmit)="continue()">
        <p class="onboarding__step">Passo {{ stepLabel }} de 8</p>
        <h1>Suas métricas</h1>
        <p class="onboarding__lead">Usamos esses dados para calcular seus macros e metas calóricas.</p>
        <nutri-info-tip
          message="Peso e altura entram no cálculo de gasto basal. O nível de atividade é o movimento do dia a dia — treinos entram no passo anterior se você é atleta."
        />
        <div class="form-grid">
          <nutri-input label="Idade" type="number" [(ngModel)]="age" name="age" />
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

  age = this.draft.draft().age;
  sex = this.draft.draft().sex;
  heightCm = this.draft.draft().heightCm;
  currentWeightKg = this.draft.draft().currentWeightKg;
  targetWeightKg = this.draft.draft().targetWeightKg;
  goal = this.draft.draft().goal;
  activityLevel = this.draft.draft().activityLevel;

  get stepLabel(): string {
    return this.draft.draft().athleteModeEnabled ? '5' : '4';
  }

  continue(): void {
    this.draft.update({
      age: this.age,
      sex: this.sex,
      heightCm: this.heightCm,
      currentWeightKg: this.currentWeightKg,
      targetWeightKg: this.targetWeightKg,
      goal: this.goal,
      activityLevel: this.activityLevel,
    });
    void this.router.navigate(['/onboarding/dieta']);
  }
}

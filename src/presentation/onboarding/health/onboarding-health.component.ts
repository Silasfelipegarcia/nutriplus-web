import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { OnboardingDraftService } from '../onboarding-draft.service';
import { OnboardingSubmitService } from '../onboarding-submit.service';
import { AuthFacade } from '../../core/auth.facade';
import { computeAgeFromBirthDate } from '../../core/date.util';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

const HEALTH_CONDITIONS = ['Diabetes', 'Hipertensão', 'Doença renal', 'Colesterol alto'] as const;

@Component({
  selector: 'app-onboarding-health',
  standalone: true,
  imports: [FormsModule, RouterLink, NutriButtonComponent, NutriInputComponent, NutriInfoTipComponent],
  template: `
    <div class="onboarding">
      <div class="onboarding__card">
        <p class="onboarding__step">Passo {{ stepLabel }} de 8</p>
        <h1>Saúde e rotina</h1>
        <p class="onboarding__lead">Informações opcionais que ajudam a IA a montar um plano mais seguro.</p>
        <nutri-info-tip
          message="A IA não substitui consulta médica. Use esses campos para alergias, condições e horários de sono."
        />
        @if (error) {
          <div class="auth-card__error">{{ error }}</div>
        }
        <div class="form-grid form-grid--full">
          <div class="form-grid--full">
            <label class="field-label">Condições de saúde (opcional)</label>
            <div class="onboarding-checks">
              @for (c of conditions; track c) {
                <label class="onboarding-check">
                  <input type="checkbox" [checked]="selectedConditions.has(c)" (change)="toggleCondition(c)" />
                  <span>{{ c }}</span>
                </label>
              }
            </div>
          </div>
          <nutri-input label="Alergias" type="textarea" [(ngModel)]="allergies" name="allergies" />
          <nutri-input label="Medicamentos" type="textarea" [(ngModel)]="medications" name="medications" />
          <nutri-input label="Observações de saúde" type="textarea" [(ngModel)]="healthNotes" name="healthNotes" />
          <nutri-input label="Horário que acorda" [(ngModel)]="wakeTime" name="wake" placeholder="07:00" />
          <nutri-input label="Horário que dorme" [(ngModel)]="sleepTime" name="sleep" placeholder="22:30" />
          @if (isSenior) {
            <div class="form-grid--full">
              <label class="field-label">Dificuldade para mastigar (opcional)</label>
              <select class="nutri-select" [(ngModel)]="chewingDifficulty" name="chewing">
                <option value="NONE">Nenhuma</option>
                <option value="MILD">Leve</option>
                <option value="MODERATE">Moderada</option>
                <option value="SEVERE">Severa</option>
              </select>
            </div>
          }
        </div>
        <div class="onboarding__actions">
          <nutri-button variant="ghost" to="/onboarding/dieta">Voltar</nutri-button>
          <nutri-button variant="primary" [disabled]="saving" (click)="save()">
            {{ saving ? 'Salvando...' : 'Continuar' }}
          </nutri-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../onboarding.scss',
})
export class OnboardingHealthComponent {
  private readonly draft = inject(OnboardingDraftService);
  private readonly submit = inject(OnboardingSubmitService);
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  readonly conditions = HEALTH_CONDITIONS;
  selectedConditions = new Set(
    this.draft
      .draft()
      .healthConditions.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  allergies = this.draft.draft().allergies;
  medications = this.draft.draft().medications;
  healthNotes = this.draft.draft().healthNotes;
  wakeTime = this.draft.draft().wakeTime;
  sleepTime = this.draft.draft().sleepTime;
  chewingDifficulty = this.draft.draft().chewingDifficulty;
  saving = false;
  error: string | null = null;

  get isSenior(): boolean {
    const birthDate = this.draft.draft().birthDate;
    return birthDate ? computeAgeFromBirthDate(birthDate) >= 65 : this.draft.draft().age >= 65;
  }

  get stepLabel(): string {
    return this.draft.draft().athleteModeEnabled ? '7' : '6';
  }

  toggleCondition(condition: string): void {
    if (this.selectedConditions.has(condition)) {
      this.selectedConditions.delete(condition);
    } else {
      this.selectedConditions.add(condition);
    }
  }

  async save(): Promise<void> {
    this.draft.update({
      healthConditions: [...this.selectedConditions].join(', '),
      allergies: this.allergies,
      medications: this.medications,
      healthNotes: this.healthNotes,
      wakeTime: this.wakeTime.trim() || '07:00',
      sleepTime: this.sleepTime.trim() || '22:30',
      chewingDifficulty: this.chewingDifficulty,
    });
    this.saving = true;
    this.error = null;
    try {
      await this.submit.submit(this.draft.draft());
      await this.auth.refreshUser();
      this.analytics.trackOnboardingProfileSubmitted();
      this.analytics.trackOnboardingStepCompleted('onboarding_health');
      this.router.navigate(['/onboarding/termos']);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Erro ao salvar perfil';
    } finally {
      this.saving = false;
    }
  }
}

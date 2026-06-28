import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NutriButtonComponent } from '../../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { computeAgeFromBirthDate } from '../../../core/date.util';
import { OnboardingDraftService } from '../../../onboarding/onboarding-draft.service';
import { ProfileEditService } from '../profile-edit.service';
import { NutriToastService } from '../../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../../core/action-feedback';

const HEALTH_CONDITIONS = ['Diabetes', 'Hipertensão', 'Doença renal', 'Colesterol alto'] as const;

@Component({
  selector: 'app-profile-edit-health',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent, NutriInputComponent, NutriInfoTipComponent],
  template: `
    <div class="portal-page">
      <div class="portal-card">
        @if (profileEdit.loading()) {
          <p class="loading-text">Carregando...</p>
        } @else {
          <form (ngSubmit)="save()">
            <h1 class="portal-section__title">Dieta e saúde</h1>
            <p class="portal-card__lead">
              Atualize estilo alimentar, restrições, condições de saúde e horários de sono.
            </p>
            <nutri-info-tip
              message="Restrições de lactose e glúten são validadas automaticamente no plano e na lista de compras."
            />
            <div class="form-grid" style="margin-top: 1rem">
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
            <nutri-info-tip
              message="A IA não substitui consulta médica. Use esses campos para alergias, condições e horários de sono."
            />
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
            @if (error) {
              <div class="auth-card__error">{{ error }}</div>
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
export class ProfileEditHealthComponent implements OnInit {
  readonly profileEdit = inject(ProfileEditService);
  private readonly draft = inject(OnboardingDraftService);
  private readonly router = inject(Router);
  private readonly toast = inject(NutriToastService);

  readonly conditions = HEALTH_CONDITIONS;
  selectedConditions = new Set<string>();
  dietaryPreference = 'OMNIVORE';
  restriction = 'NONE';
  allergies = '';
  medications = '';
  healthNotes = '';
  wakeTime = '07:00';
  sleepTime = '22:30';
  chewingDifficulty = 'NONE';
  saving = false;
  error: string | null = null;

  get isSenior(): boolean {
    const birthDate = this.draft.draft().birthDate;
    return birthDate ? computeAgeFromBirthDate(birthDate) >= 65 : this.draft.draft().age >= 65;
  }

  async ngOnInit(): Promise<void> {
    await this.profileEdit.bootstrap(true);
    this.loadFromDraft();
  }

  private loadFromDraft(): void {
    const d = this.draft.draft();
    this.dietaryPreference = d.dietaryPreference;
    this.restriction = d.restriction;
    this.allergies = d.allergies;
    this.medications = d.medications;
    this.healthNotes = d.healthNotes;
    this.wakeTime = d.wakeTime;
    this.sleepTime = d.sleepTime;
    this.chewingDifficulty = d.chewingDifficulty;
    this.selectedConditions = new Set(
      d.healthConditions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
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
      dietaryPreference: this.dietaryPreference,
      restriction: this.restriction,
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

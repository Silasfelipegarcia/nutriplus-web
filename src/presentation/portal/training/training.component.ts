import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { MealPlanGenerationFacade } from '../../core/meal-plan-generation.facade';
import { PortalDataStore } from '../../core/portal-data.store';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { parseApiError } from '../../../infrastructure/http/api-error';
import { NutriSportPickerComponent } from '../../../design-system/nutri-sport-picker/nutri-sport-picker.component';
import { SportSelection } from '../../core/sport-catalog';
import {
  NutritionProfile,
  SportCatalogItem,
  TrainingProfile,
  TrainingActivityItem,
  profileTypeLabel,
} from '../../../domain/entities';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    NgTemplateOutlet,
    NutriButtonComponent,
    NutriInputComponent,
    NutriInfoTipComponent,
    NutriSportPickerComponent,
  ],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Modo atleta</h1>
        <p>Configure suas atividades para ajuste calórico extra no plano.</p>
      </div>

      @if (loading()) {
        <p class="loading-text">Carregando...</p>
      } @else if (error()) {
        <div class="auth-card__error">{{ error() }}</div>
      } @else {
        <nutri-info-tip
          message="Configure depois do onboarding. O nível de atividade geral continua no perfil; aqui você detalha esportes para ajustar calorias do plano."
        />

        @if (showActivateDialog()) {
          <div class="training-dialog-backdrop" (click)="cancelActivateDialog()">
            <div class="training-dialog" role="dialog" (click)="$event.stopPropagation()">
              <h3>Ativar modo atleta?</h3>
              <p>
                Seu perfil passará a <strong>Perfil atleta</strong>. Você precisará cadastrar pelo menos um
                treino e salvar para que as calorias extras entrem no plano alimentar.
              </p>
              <div class="portal-actions" style="margin-top: 1rem; padding-top: 0; border: none">
                <nutri-button variant="ghost" (click)="cancelActivateDialog()">Cancelar</nutri-button>
                <nutri-button variant="primary" (click)="confirmActivate()">Continuar</nutri-button>
              </div>
            </div>
          </div>
        }

        @if (showDeactivateDialog()) {
          <div class="training-dialog-backdrop" (click)="cancelDeactivateDialog()">
            <div class="training-dialog" role="dialog" (click)="$event.stopPropagation()">
              <h3>Desativar modo atleta?</h3>
              <p>
                Seus treinos serão removidos e o perfil voltará ao modo normal. Gere um novo plano para
                atualizar suas metas calóricas.
              </p>
              <div class="portal-actions" style="margin-top: 1rem; padding-top: 0; border: none">
                <nutri-button variant="ghost" (click)="cancelDeactivateDialog()">Cancelar</nutri-button>
                <nutri-button variant="primary" [disabled]="saving" (click)="deactivate()">
                  {{ saving ? 'Salvando...' : 'Desativar' }}
                </nutri-button>
              </div>
            </div>
          </div>
        }

        @if (showRegenerateDialog()) {
          <div class="training-dialog-backdrop" (click)="closeRegenerateDialog()">
            <div class="training-dialog" role="dialog" (click)="$event.stopPropagation()">
              <h3>Metas atualizadas</h3>
              <p>
                @if (nutrition()?.targetCalories) {
                  Suas metas foram ajustadas para
                  <strong>{{ nutrition()!.targetCalories | number:'1.0-0' }} kcal/dia</strong>
                  @if (nutrition()?.trainingDailyExtraKcal) {
                    (+{{ nutrition()!.trainingDailyExtraKcal | number:'1.0-0' }} de treino)
                  }.
                } @else {
                  Suas calorias e macros foram ajustadas com base nos treinos.
                }
                Deseja gerar um novo plano alimentar agora?
              </p>
              <div class="portal-actions" style="margin-top: 1rem; padding-top: 0; border: none">
                <nutri-button variant="ghost" (click)="closeRegenerateDialog()">Depois</nutri-button>
                <nutri-button variant="primary" [disabled]="generation.phase() === 'generating'" (click)="generatePlan()">
                  {{ generation.phase() === 'generating' ? 'Gerando...' : 'Gerar plano' }}
                </nutri-button>
              </div>
            </div>
          </div>
        }

        <!-- Estado A: modo geral -->
        @if (isGeneralMode()) {
          <section class="portal-section">
            <div class="portal-card">
              <p class="portal-card__lead">
                Você está no <strong>{{ typeLabel() }}</strong>. Ative o modo atleta para
                incluir o gasto dos treinos no cálculo do plano.
              </p>
              <div class="portal-actions" style="margin-top: 1rem; padding-top: 0; border: none">
                <nutri-button variant="primary" (click)="openActivateDialog()">Ativar modo atleta</nutri-button>
              </div>
            </div>
          </section>
        }

        <!-- Estado B: fluxo de ativação -->
        @if (isActivating()) {
          <nutri-info-tip message="Modo atleta será ativado ao salvar. Adicione pelo menos um treino." />
          <ng-container *ngTemplateOutlet="activityForm" />
          <div class="portal-actions">
            <nutri-button variant="ghost" (click)="cancelActivation()">Cancelar</nutri-button>
            <nutri-button
              variant="primary"
              [disabled]="saving || !draftActivities().length"
              (click)="saveAndActivate()"
            >
              {{ saving ? 'Salvando...' : 'Salvar e ativar' }}
            </nutri-button>
          </div>
        }

        <!-- Estado C: atleta ativo -->
        @if (isAthleteActive()) {
          <div class="portal-card portal-card--highlight" style="margin-bottom: 1.25rem">
            <span class="portal-badge">{{ typeLabel() }}</span>
            @if (savedProfile()?.appliedToPlan) {
              <p style="margin: 0.75rem 0 0; color: var(--nutri-brand); font-weight: 600">
                ✓ Metas diárias incluem o gasto dos treinos
              </p>
            }
          </div>

          @if (savedProfile()?.weeklyTrainingKcal) {
            <div class="portal-card portal-card--highlight">
              <h3 class="portal-card__title">Resumo calórico</h3>
              <p>Extra semanal (treinos): ~{{ savedProfile()!.weeklyTrainingKcal | number:'1.0-0' }} kcal</p>
              <p>Média diária extra: ~{{ savedProfile()!.dailyExtraKcal | number:'1.0-0' }} kcal</p>
              @if (savedProfile()!.adjustedTargetCalories) {
                <p>
                  <strong>Meta calórica prevista: {{ savedProfile()!.adjustedTargetCalories | number:'1.0-0' }} kcal/dia</strong>
                </p>
              }
            </div>
          }

          @if (!editing()) {
            <section class="portal-section">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap">
                <h2 class="portal-section__title" style="margin: 0">Seus treinos</h2>
                <nutri-button variant="secondary" size="sm" (click)="startEditing()">Editar treinos</nutri-button>
              </div>
              <div class="portal-list">
                @for (a of savedProfile()!.activities; track a.sportType) {
                  <div class="portal-list-item">
                    <div class="portal-list-item__main">
                      <strong>{{ activityLabel(a) }}</strong>
                      <span>{{ a.daysPerWeek }}x/semana · {{ a.minutesPerSession }} min/sessão</span>
                    </div>
                    <div class="portal-list-item__aside">
                      <span class="portal-list-item__meta">+{{ a.caloriesPerWeek }} kcal/sem</span>
                    </div>
                  </div>
                }
              </div>
            </section>

            <div class="portal-actions">
              <nutri-button variant="ghost" (click)="openDeactivateDialog()">Desativar modo atleta</nutri-button>
            </div>
          } @else {
            <ng-container *ngTemplateOutlet="activityForm" />
            <div class="portal-actions">
              <nutri-button variant="ghost" (click)="cancelEditing()">Cancelar</nutri-button>
              <nutri-button variant="primary" [disabled]="saving || !draftActivities().length" (click)="saveEdits()">
                {{ saving ? 'Salvando...' : 'Salvar e aplicar ao plano' }}
              </nutri-button>
            </div>
          }
        }
      }

      <ng-template #activityForm>
        <section class="portal-section">
          <h2 class="portal-section__title">Adicionar atividade</h2>
          <div class="portal-card">
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
            <div class="portal-actions" style="margin-top: 0; padding-top: 0; border: none">
              <nutri-button variant="secondary" (click)="addActivity()">Adicionar atividade</nutri-button>
            </div>
          </div>
        </section>

        @if (draftActivities().length) {
          <section class="portal-section">
            <h2 class="portal-section__title">Atividades no rascunho</h2>
            <div class="portal-list">
              @for (a of draftActivities(); track activityKey(a)) {
                <div class="portal-list-item">
                  <div class="portal-list-item__main">
                    <strong>{{ activityLabel(a) }}</strong>
                    <span>{{ a.daysPerWeek }}x/semana · {{ a.minutesPerSession }} min/sessão</span>
                  </div>
                  <div class="portal-list-item__aside">
                    <span class="portal-list-item__meta">+{{ a.caloriesPerWeek }} kcal/sem</span>
                    <nutri-button variant="ghost" size="sm" (click)="removeActivity(a)">Remover</nutri-button>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      </ng-template>
    </div>
  `,
  styles: `
    .training-dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .training-dialog {
      background: white;
      border-radius: var(--nutri-radius);
      padding: 1.5rem;
      max-width: 420px;
      width: 100%;
      box-shadow: var(--nutri-shadow);
    }
    .training-dialog h3 {
      margin: 0 0 0.75rem;
      font-size: 1.1rem;
    }
    .training-dialog p {
      margin: 0;
      color: var(--nutri-ink-muted);
      line-height: 1.55;
      font-size: 0.92rem;
    }
  `,
  styleUrl: '../portal.scss',
})
export class TrainingComponent implements OnInit {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly portalData = inject(PortalDataStore);
  private readonly toast = inject(NutriToastService);
  readonly generation = inject(MealPlanGenerationFacade);

  readonly profileTypeLabel = profileTypeLabel;
  readonly sports = signal<SportCatalogItem[]>([]);
  readonly savedProfile = signal<TrainingProfile | null>(null);
  readonly nutrition = signal<NutritionProfile | null>(null);
  readonly draftActivities = signal<TrainingActivityItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activating = signal(false);
  readonly editing = signal(false);
  readonly showActivateDialog = signal(false);
  readonly showDeactivateDialog = signal(false);
  readonly showRegenerateDialog = signal(false);

  sportSelection: SportSelection | null = null;
  daysPerWeekStr = '3';
  minutesPerSessionStr = '60';
  saving = false;
  applying = false;

  isGeneralMode(): boolean {
    return !this.savedProfile()?.athleteModeEnabled && !this.activating();
  }

  isActivating(): boolean {
    return this.activating() && !this.savedProfile()?.athleteModeEnabled;
  }

  isAthleteActive(): boolean {
    return Boolean(this.savedProfile()?.athleteModeEnabled);
  }

  typeLabel(): string {
    const n = this.nutrition();
    if (n) return profileTypeLabel(n);
    return this.savedProfile()?.athleteModeEnabled ? 'Perfil atleta' : 'Perfil normal';
  }

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [sports, nutrition, profile] = await Promise.all([
        this.portalData.loadSportCatalog(),
        this.portalData.loadNutritionProfile(),
        this.portalData.loadTrainingProfile(),
      ]);
      this.sports.set(sports);
      this.nutrition.set(nutrition);
      this.savedProfile.set(profile);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar perfil de treino');
    } finally {
      this.loading.set(false);
    }
  }

  openActivateDialog(): void {
    this.showActivateDialog.set(true);
  }

  cancelActivateDialog(): void {
    this.showActivateDialog.set(false);
  }

  confirmActivate(): void {
    this.showActivateDialog.set(false);
    this.activating.set(true);
    this.draftActivities.set([]);
  }

  cancelActivation(): void {
    this.activating.set(false);
    this.draftActivities.set([]);
  }

  openDeactivateDialog(): void {
    this.showDeactivateDialog.set(true);
  }

  cancelDeactivateDialog(): void {
    this.showDeactivateDialog.set(false);
  }

  async deactivate(): Promise<void> {
    this.saving = true;
    try {
      this.savedProfile.set(await this.nutritionRepo.saveTrainingProfile(false, []));
      this.showDeactivateDialog.set(false);
      this.editing.set(false);
      this.activating.set(false);
      this.draftActivities.set([]);
      await this.afterApply();
      this.toast.success('Modo atleta desativado');
    } catch (e) {
      const message = parseApiError(e).message;
      this.error.set(message);
      this.toast.error(message);
    } finally {
      this.saving = false;
    }
  }

  startEditing(): void {
    const activities = this.savedProfile()?.activities ?? [];
    this.draftActivities.set(activities.map((a) => ({ ...a })));
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
    this.draftActivities.set([]);
  }

  activityLabel(a: TrainingActivityItem): string {
    return a.customLabel?.trim() || a.label;
  }

  activityKey(a: TrainingActivityItem): string {
    return a.customLabel ? `${a.sportType}:${a.customLabel}` : a.sportType;
  }

  addActivity(): void {
    const sel = this.sportSelection;
    if (!sel) {
      this.toast.error('Selecione ou digite um esporte.');
      return;
    }
    const draft: TrainingActivityItem = {
      sportType: sel.sportType,
      label: sel.label,
      customLabel: sel.customLabel,
      daysPerWeek: 0,
      minutesPerSession: 0,
      caloriesPerSession: 0,
      caloriesPerWeek: 0,
    };
    if (this.draftActivities().some((a) => this.activityKey(a) === this.activityKey(draft))) {
      this.toast.error('Esta atividade já foi adicionada.');
      return;
    }

    const sport = this.sports().find((s) => s.sportType === sel.sportType) ?? {
      sportType: sel.sportType,
      label: sel.label,
      met: sel.met,
      intensityHint: '',
    };
    const days = Math.min(7, Math.max(1, Number(this.daysPerWeekStr) || 3));
    const minutes = Math.max(15, Number(this.minutesPerSessionStr) || 60);
    const weight = this.nutrition()?.currentWeightKg ?? 70;
    const kcalPerMin = (sport.met * 3.5 * weight) / 200;
    const kcalSession = Math.round(kcalPerMin * minutes);

    this.draftActivities.update((list) => [
      ...list,
      {
        sportType: sel.sportType,
        label: sel.customLabel?.trim() || sel.label,
        customLabel: sel.customLabel,
        daysPerWeek: days,
        minutesPerSession: minutes,
        caloriesPerSession: kcalSession,
        caloriesPerWeek: kcalSession * days,
      },
    ]);
    this.sportSelection = null;
  }

  removeActivity(activity: TrainingActivityItem): void {
    const key = this.activityKey(activity);
    this.draftActivities.update((list) => list.filter((a) => this.activityKey(a) !== key));
  }

  async saveAndActivate(): Promise<void> {
    this.saving = true;
    this.error.set(null);
    try {
      const profile = await this.nutritionRepo.saveTrainingProfile(true, this.draftActivities());
      this.savedProfile.set(profile);
      this.activating.set(false);
      await this.afterApply();
      this.toast.success('Modo atleta ativado e metas atualizadas');
    } catch (e) {
      const message = parseApiError(e).message;
      this.error.set(message);
      this.toast.error(message);
    } finally {
      this.saving = false;
    }
  }

  async saveEdits(): Promise<void> {
    this.saving = true;
    this.error.set(null);
    try {
      const profile = await this.nutritionRepo.saveTrainingProfile(true, this.draftActivities());
      this.savedProfile.set(profile);
      this.editing.set(false);
      this.draftActivities.set([]);
      await this.afterApply();
      this.toast.success('Treinos salvos e metas atualizadas');
    } catch (e) {
      const message = parseApiError(e).message;
      this.error.set(message);
      this.toast.error(message);
    } finally {
      this.saving = false;
    }
  }

  async saveAndApply(): Promise<void> {
    await this.saveEdits();
  }

  async applyToPlan(): Promise<void> {
    this.applying = true;
    this.error.set(null);
    try {
      const activities = this.savedProfile()?.activities ?? [];
      const profile = await this.nutritionRepo.saveTrainingProfile(true, activities);
      this.savedProfile.set(profile);
      await this.afterApply();
      this.toast.success('Metas atualizadas com base nos treinos');
    } catch (e) {
      const message = parseApiError(e).message;
      this.error.set(message);
      this.toast.error(message);
    } finally {
      this.applying = false;
    }
  }

  private async afterApply(): Promise<void> {
    this.portalData.invalidate('nutritionProfile', 'trainingProfile');
    const p = await this.portalData.loadTrainingProfile(true);
    this.savedProfile.set(p);
    this.nutrition.set(await this.portalData.loadNutritionProfile(true));
    this.showRegenerateDialog.set(true);
  }

  closeRegenerateDialog(): void {
    this.showRegenerateDialog.set(false);
  }

  async generatePlan(): Promise<void> {
    this.showRegenerateDialog.set(false);
    await this.generation.generate();
  }
}

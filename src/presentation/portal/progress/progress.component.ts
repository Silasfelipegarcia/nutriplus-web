import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { NutriEmptyStateComponent } from '../../../design-system/nutri-empty-state/nutri-empty-state.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { ProgressSchedule, ProgressReview, BodyMeasurement, TREND_LABELS } from '../../../domain/entities';
import { isNotFound } from '../../../infrastructure/http/api-error';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    FormsModule,
    NutriButtonComponent,
    NutriInputComponent,
    NutriInfoTipComponent,
    NutriEmptyStateComponent,
  ],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Progresso</h1>
        <p>Registre medições e acompanhe sua evolução corporal.</p>
      </div>

      @if (schedule()) {
        <div class="portal-card" [class.portal-card--highlight]="schedule()!.due">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap">
            <div>
              <h3 class="portal-card__title">Próxima revisão</h3>
              @if (schedule()!.due) {
                <p class="portal-card__lead" style="margin: 0">Está na hora de registrar novas medições!</p>
              } @else {
                <p class="portal-card__lead" style="margin: 0">
                  Próxima revisão em <strong>{{ schedule()!.daysUntilDue }} dias</strong>.
                </p>
              }
            </div>
            @if (schedule()!.due) {
              <span class="portal-badge portal-badge--due">Revisão pendente</span>
            }
          </div>
        </div>
      }

      @if (canShowForm()) {
        <section class="portal-section">
          <h2 class="portal-section__title">{{ canEditToday() ? 'Alterar medição de hoje' : 'Nova medição' }}</h2>
          <div class="portal-card">
            @if (canEditToday()) {
              <nutri-info-tip
                message="Você pode corrigir os valores de hoje. Depois de amanhã, a medição fica registrada até o próximo ciclo."
              />
            } @else {
              <p class="portal-card__lead">Preencha o que tiver disponível — peso é o campo principal.</p>
            }
            <div class="form-grid">
              <nutri-input label="Peso (kg)" type="number" [(ngModel)]="weightKgStr" name="weight" />
              <nutri-input label="Gordura (%)" type="number" [(ngModel)]="bodyFatStr" name="bf" />
              <nutri-input label="Cintura (cm)" type="number" [(ngModel)]="waistCmStr" name="waist" />
              <nutri-input label="Quadril (cm)" type="number" [(ngModel)]="hipCmStr" name="hip" />
            </div>
            <div class="portal-actions" style="margin-top: 0; padding-top: 0; border: none">
              <nutri-button variant="primary" [disabled]="saving" (click)="saveMeasurement()">
                {{ saving ? 'Salvando...' : (canEditToday() ? 'Salvar alteração' : 'Salvar medição') }}
              </nutri-button>
            </div>
          </div>
        </section>
      } @else if (schedule()) {
        <section class="portal-section">
          <nutri-empty-state
            icon="📏"
            title="Medição registrada neste ciclo"
            [message]="lockedMessage()"
          />
          @if (latestMeasurement()) {
            <div class="portal-card portal-card--highlight" style="margin-top: 1rem">
              <h3 class="portal-card__title">Última medição</h3>
              <p class="portal-card__lead" style="margin: 0">{{ measurementSummary(latestMeasurement()!) }}</p>
            </div>
          }
        </section>
      }

      @if (review()) {
        <section class="portal-section">
          <h2 class="portal-section__title">Última revisão</h2>
          <div class="portal-card">
            <h3 class="portal-card__title">{{ trendLabel(review()!.trend) }}</h3>
            <p>{{ review()!.summary }}</p>
            @if (review()!.recommendations.length) {
              <ul>
                @for (rec of review()!.recommendations; track rec) {
                  <li>{{ rec }}</li>
                }
              </ul>
            }
          </div>
        </section>
      }

      <section class="portal-section">
        <h2 class="portal-section__title">Revisão com IA</h2>
        @if (schedule()?.due) {
          <div class="portal-actions" style="margin-top: 0; padding-top: 0; border: none">
            <nutri-button variant="secondary" [disabled]="generatingReview" (click)="generateReview()">
              {{ generatingReview ? 'Analisando...' : 'Gerar revisão com IA' }}
            </nutri-button>
          </div>
        } @else if (schedule()) {
          <nutri-info-tip [message]="reviewUnavailableMessage()" />
        }
      </section>
    </div>
  `,
  styleUrl: '../portal.scss',
})
export class ProgressComponent implements OnInit {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly toast = inject(NutriToastService);
  private readonly analytics = inject(AnalyticsService);

  readonly schedule = signal<ProgressSchedule | null>(null);
  readonly review = signal<ProgressReview | null>(null);
  readonly latestMeasurement = signal<BodyMeasurement | null>(null);
  weightKgStr = '';
  bodyFatStr = '';
  waistCmStr = '';
  hipCmStr = '';
  saving = false;
  generatingReview = false;

  async ngOnInit(): Promise<void> {
    await this.loadSchedule();
    await this.loadLatestMeasurement();
    try {
      this.review.set(await this.nutritionRepo.getLatestProgressReview());
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
  }

  canRegisterNew(): boolean {
    return this.schedule()?.due === true;
  }

  canEditToday(): boolean {
    const s = this.schedule();
    if (!s || s.due) return false;
    return this.isToday(s.lastMeasurementOn);
  }

  canShowForm(): boolean {
    return this.canRegisterNew() || this.canEditToday();
  }

  lockedMessage(): string {
    const days = this.schedule()?.daysUntilDue;
    if (days == null) {
      return 'Aguarde o prazo do próximo ciclo para registrar novas medidas.';
    }
    return `Suas medidas deste ciclo já foram registradas. A próxima medição estará disponível em ${days} dias.`;
  }

  measurementSummary(m: BodyMeasurement): string {
    const parts = [`${m.weightKg} kg`];
    if (m.bodyFatPercent) parts.push(`${m.bodyFatPercent}% gordura`);
    if (m.waistCm) parts.push(`cintura ${m.waistCm} cm`);
    if (m.hipCm) parts.push(`quadril ${m.hipCm} cm`);
    const date = m.measuredOn ? this.formatDate(m.measuredOn) : 'hoje';
    return `${parts.join(' · ')} — ${date}`;
  }

  trendLabel(trend?: string): string {
    return trend ? (TREND_LABELS[trend] ?? 'Revisão de progresso') : 'Revisão de progresso';
  }

  reviewUnavailableMessage(): string {
    const days = this.schedule()?.daysUntilDue;
    if (days == null) {
      return 'A análise com IA fica disponível quando a próxima revisão estiver no prazo.';
    }
    return `A análise com IA fica disponível quando a próxima revisão estiver no prazo (em ${days} dias).`;
  }

  async saveMeasurement(): Promise<void> {
    if (!this.canShowForm()) {
      this.toast.info(this.lockedMessage());
      return;
    }
    this.saving = true;
    const weightKg = Number(this.weightKgStr);
    const bodyFat = Number(this.bodyFatStr);
    const waistCm = Number(this.waistCmStr);
    const hipCm = Number(this.hipCmStr);
    const measurement: BodyMeasurement = {
      measuredOn: this.todayIso(),
      weightKg,
      ...(bodyFat ? { bodyFatPercent: bodyFat } : {}),
      ...(waistCm ? { waistCm } : {}),
      ...(hipCm ? { hipCm } : {}),
    };
    const editing = this.canEditToday();
    const ok = await withActionFeedback(
      this.toast,
      async () => {
        const saved = await this.nutritionRepo.saveBodyMeasurement(measurement);
        this.latestMeasurement.set(saved);
        this.applyMeasurementToForm(saved);
        await this.loadSchedule();
      },
      { success: editing ? 'Medição atualizada' : 'Medição registrada' },
    );
    this.saving = false;
    if (!ok) return;
    this.analytics.trackMeasurementSaved();
  }

  async generateReview(): Promise<void> {
    if (!this.schedule()?.due) {
      this.toast.info(this.reviewUnavailableMessage());
      return;
    }
    this.generatingReview = true;
    const ok = await withActionFeedback(
      this.toast,
      async () => {
        this.review.set(await this.nutritionRepo.generateProgressReview());
        await this.loadSchedule();
      },
      { success: 'Revisão gerada com IA' },
    );
    this.generatingReview = false;
    if (!ok) return;
    this.analytics.trackReviewGenerated();
  }

  private async loadSchedule(): Promise<void> {
    try {
      this.schedule.set(await this.nutritionRepo.getProgressSchedule());
    } catch {
      // ignore
    }
  }

  private async loadLatestMeasurement(): Promise<void> {
    try {
      const latest = await this.nutritionRepo.getLatestBodyMeasurement();
      this.latestMeasurement.set(latest);
      if (this.canShowForm()) {
        this.applyMeasurementToForm(latest);
      }
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
  }

  private applyMeasurementToForm(m: BodyMeasurement): void {
    this.weightKgStr = String(m.weightKg);
    this.bodyFatStr = m.bodyFatPercent != null ? String(m.bodyFatPercent) : '';
    this.waistCmStr = m.waistCm != null ? String(m.waistCm) : '';
    this.hipCmStr = m.hipCm != null ? String(m.hipCm) : '';
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private isToday(iso?: string): boolean {
    return iso === this.todayIso();
  }

  private formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    if (!d) return iso;
    return `${d}/${m}/${y}`;
  }
}

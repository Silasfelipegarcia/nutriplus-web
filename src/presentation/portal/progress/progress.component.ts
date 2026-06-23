import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { ProgressSchedule, ProgressReview, BodyMeasurement, TREND_LABELS } from '../../../domain/entities';
import { isNotFound } from '../../../infrastructure/http/api-error';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent, NutriInputComponent],
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

      <section class="portal-section">
        <h2 class="portal-section__title">Nova medição</h2>
        <div class="portal-card">
          <p class="portal-card__lead">Preencha o que tiver disponível — peso é o campo principal.</p>
          <div class="form-grid">
            <nutri-input label="Peso (kg)" type="number" [(ngModel)]="weightKgStr" name="weight" />
            <nutri-input label="Gordura (%)" type="number" [(ngModel)]="bodyFatStr" name="bf" />
            <nutri-input label="Cintura (cm)" type="number" [(ngModel)]="waistCmStr" name="waist" />
            <nutri-input label="Quadril (cm)" type="number" [(ngModel)]="hipCmStr" name="hip" />
          </div>
          <div class="portal-actions" style="margin-top: 0; padding-top: 0; border: none">
            <nutri-button variant="primary" [disabled]="saving" (click)="saveMeasurement()">
              {{ saving ? 'Salvando...' : 'Salvar medição' }}
            </nutri-button>
          </div>
        </div>
      </section>

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

      <div class="portal-actions">
        <nutri-button variant="secondary" [disabled]="generatingReview" (click)="generateReview()">
          {{ generatingReview ? 'Analisando...' : 'Gerar revisão com IA' }}
        </nutri-button>
      </div>
    </div>
  `,
  styleUrl: '../portal.scss',
})
export class ProgressComponent implements OnInit {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);

  readonly schedule = signal<ProgressSchedule | null>(null);
  readonly review = signal<ProgressReview | null>(null);
  weightKgStr = '70';
  bodyFatStr = '';
  waistCmStr = '';
  hipCmStr = '';
  saving = false;
  generatingReview = false;

  async ngOnInit(): Promise<void> {
    try {
      this.schedule.set(await this.nutritionRepo.getProgressSchedule());
    } catch {
      // ignore
    }
    try {
      this.review.set(await this.nutritionRepo.getLatestProgressReview());
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
  }

  trendLabel(trend?: string): string {
    return trend ? (TREND_LABELS[trend] ?? 'Revisão de progresso') : 'Revisão de progresso';
  }

  async saveMeasurement(): Promise<void> {
    this.saving = true;
    const weightKg = Number(this.weightKgStr);
    const bodyFat = Number(this.bodyFatStr);
    const waistCm = Number(this.waistCmStr);
    const hipCm = Number(this.hipCmStr);
    const measurement: BodyMeasurement = {
      measuredOn: new Date().toISOString().slice(0, 10),
      weightKg,
      ...(bodyFat ? { bodyFatPercent: bodyFat } : {}),
      ...(waistCm ? { waistCm } : {}),
      ...(hipCm ? { hipCm } : {}),
    };
    try {
      await this.nutritionRepo.saveBodyMeasurement(measurement);
    } finally {
      this.saving = false;
    }
  }

  async generateReview(): Promise<void> {
    this.generatingReview = true;
    try {
      this.review.set(await this.nutritionRepo.generateProgressReview());
    } finally {
      this.generatingReview = false;
    }
  }
}

import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriEmptyStateComponent } from '../../../design-system/nutri-empty-state/nutri-empty-state.component';
import { NutriPlanAdherenceChartComponent } from '../../../design-system/nutri-plan-adherence-chart/nutri-plan-adherence-chart.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { PlanAdherenceHistory } from '../../../domain/entities';
import { GenerationPhase, MealPlanGenerationFacade } from '../../core/meal-plan-generation.facade';
import { PortalDataStore } from '../../core/portal-data.store';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';
import { isNotFound } from '../../../infrastructure/http/api-error';
import { PortalPageSkeletonComponent } from '../portal-page-skeleton.component';
import { APP_COPY } from '../../core/app-copy';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    NutriButtonComponent,
    NutriEmptyStateComponent,
    NutriPlanAdherenceChartComponent,
    PortalPageSkeletonComponent,
  ],
  template: `
    <div class="portal-page">
      <div class="portal-main__header dashboard-header">
        <h1>Hoje</h1>
        <p class="dashboard-header__date">{{ todayDateLabel }}</p>
        @if (portalData.nutritionProfile(); as profile) {
          <p class="dashboard-header__meta">
            Meta: {{ profile.targetCalories | number:'1.0-0' }} kcal ·
            {{ profile.targetProteinG | number:'1.0-0' }}g proteína
          </p>
        }
      </div>

    @if (generation.showReadyNotice()) {
      <div class="plan-ready-notice">
        <div class="plan-ready-notice__content">
          <p class="plan-ready-notice__title">{{ planReadyTitle }}</p>
        </div>
        <div class="plan-ready-notice__actions">
          <a routerLink="/app/plano" class="plan-ready-notice__link">{{ planReadyAction }}</a>
          <button type="button" class="plan-ready-notice__dismiss" (click)="dismissPlanNotice()">×</button>
        </div>
      </div>
    }

    @if (generation.phase() === 'failed' && generation.error()) {
      <div class="auth-card__error">{{ generation.error() }}</div>
    }

    @if (portalData.checkinStats(); as stats) {
      <div class="dashboard-summary-strip">
        <div class="dashboard-summary-chip">
          <span class="dashboard-summary-chip__label">Sequência</span>
          <span class="dashboard-summary-chip__value">{{ stats.currentStreak }} dias</span>
        </div>
        <div class="dashboard-summary-chip">
          <span class="dashboard-summary-chip__label">Aderência</span>
          <span class="dashboard-summary-chip__value">{{ stats.weekAdherencePercent }}%</span>
        </div>
        @if (portalData.todayCheckins(); as checkins) {
          @if (checkins.totalCount) {
            <div class="dashboard-summary-chip">
              <span class="dashboard-summary-chip__label">Refeições</span>
              <span class="dashboard-summary-chip__value">
                {{ checkins.completedCount }}/{{ checkins.totalCount }}
              </span>
            </div>
          }
        }
      </div>
    }

    @if (portalData.nutritionProfile(); as profile) {
      <div class="macro-grid">
        <div class="macro-card"><strong>{{ profile.targetCalories | number:'1.0-0' }}</strong><span>kcal/dia</span></div>
        <div class="macro-card"><strong>{{ profile.targetProteinG | number:'1.0-0' }}g</strong><span>proteína</span></div>
        <div class="macro-card"><strong>{{ profile.targetCarbsG | number:'1.0-0' }}g</strong><span>carbos</span></div>
        <div class="macro-card"><strong>{{ profile.targetFatG | number:'1.0-0' }}g</strong><span>gordura</span></div>
      </div>
      @if (profile.athleteModeEnabled && profile.trainingDailyExtraKcal) {
        <p class="portal-card__lead" style="margin-top: 0.75rem">
          +{{ profile.trainingDailyExtraKcal | number:'1.0-0' }} kcal/dia de treino incluídas na meta.
        </p>
      }
    }

    @if (portalData.todayCheckins(); as checkins) {
      @if (checkins.targetCalories) {
        <section class="portal-section dashboard-calories">
          <h2 class="portal-section__title">Calorias de hoje</h2>
          <div class="dashboard-calories__bar">
            <div
              class="dashboard-calories__fill"
              [style.width.%]="calorieProgress(checkins)"
              [class.dashboard-calories__fill--over]="isOverTarget(checkins)"
            ></div>
          </div>
          <p class="dashboard-calories__label">
            {{ checkins.totalIntakeCalories ?? 0 }} / {{ checkins.targetCalories }} kcal
            @if (checkins.completedCount != null && checkins.totalCount) {
              · {{ checkins.completedCount }}/{{ checkins.totalCount }} refeições
            }
          </p>
        </section>
      }

      <section class="portal-section">
        <h2 class="portal-section__title">Check-ins de hoje</h2>
        <div class="checkin-list">
        @for (meal of checkins.meals; track meal.mealId) {
          <div class="checkin-item">
            <div class="checkin-item__body">
              <div class="checkin-item__head">
                <strong>{{ meal.mealName }}</strong>
                @if (meal.mealCalories) {
                  <span class="checkin-item__kcal">{{ meal.mealCalories | number:'1.0-0' }} kcal</span>
                }
              </div>
              @if (meal.items?.length) {
                <ul class="checkin-item__foods">
                  @for (item of meal.items; track item.id ?? item.foodName) {
                    <li>
                      <span>{{ item.foodName }}</span>
                      @if (item.calories) {
                        <span>{{ item.calories | number:'1.0-0' }} kcal</span>
                      }
                    </li>
                  }
                </ul>
              }
            </div>
            <div class="checkin-actions">
              <button
                type="button"
                class="checkin-btn"
                [class.checkin-btn--done]="meal.status === 'DONE'"
                (click)="toggleDone(meal.mealId, meal.mealName, meal.status)"
              >Feito</button>
              <button
                type="button"
                class="checkin-btn"
                [class.checkin-btn--done]="meal.status === 'SKIPPED'"
                [disabled]="meal.status === 'DONE'"
                (click)="markCheckin(meal.mealId, 'SKIPPED')"
              >Pulei</button>
            </div>
          </div>
        }
        </div>
      </section>

      @if (weekAdherence(); as week) {
        <section class="portal-section portal-section--chart">
          <div class="dashboard-week-header">
            <h2 class="portal-section__title">Últimos 7 dias</h2>
            <a routerLink="/app/evolucao" [queryParams]="{ view: 'plan' }">Ver evolução</a>
          </div>
          <nutri-plan-adherence-chart
            [daily]="week.daily"
            [targetCalories]="week.targetCalories"
            [showDisclaimer]="false"
          />
        </section>
      } @else if (portalData.todayCheckins()) {
        <section class="portal-section portal-section--chart portal-section--chart-skeleton" aria-hidden="true">
          <div class="dashboard-week-header">
            <h2 class="portal-section__title">Últimos 7 dias</h2>
          </div>
          <div class="chart-skeleton"></div>
        </section>
      }
    } @else if (!loading()) {
      <nutri-empty-state
        icon="🍽️"
        [title]="planEmptyTitle"
        [message]="planEmptyMessage"
      >
        <nutri-button variant="primary" (click)="generate()" [disabled]="generation.phase() === 'generating'">
          {{ planEmptyAction }}
        </nutri-button>
      </nutri-empty-state>
    }

    @if (loading() && !portalData.todayCheckins()) {
      <app-portal-page-skeleton [cards]="2" [rows]="3" />
    }
    </div>
  `,
  styles: `
    .dashboard-calories__bar {
      height: 10px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--nutri-brand) 12%, white);
      overflow: hidden;
    }

    .dashboard-calories__fill {
      height: 100%;
      background: var(--nutri-brand);
      border-radius: 999px;
      max-width: 100%;
    }

    .dashboard-calories__fill--over {
      background: #e07b39;
    }

    .dashboard-calories__label {
      margin: 0.5rem 0 0;
      font-size: 0.9rem;
      color: var(--nutri-ink-muted);
    }

    .dashboard-week-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .dashboard-week-header a {
      font-size: 0.9rem;
      color: var(--nutri-brand);
      text-decoration: none;
      font-weight: 600;
    }

    .portal-section--chart {
      min-height: 280px;
    }

    .chart-skeleton {
      height: 220px;
      border-radius: var(--nutri-radius-sm);
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--nutri-border) 35%, white) 0%,
        color-mix(in srgb, var(--nutri-border) 15%, white) 50%,
        color-mix(in srgb, var(--nutri-border) 35%, white) 100%
      );
      background-size: 200% 100%;
      animation: chart-skeleton-shimmer 1.4s ease-in-out infinite;
    }

    @keyframes chart-skeleton-shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
  `,
  styleUrl: '../portal.scss',
})
export class DashboardComponent implements OnInit {
  readonly planReadyTitle = APP_COPY.planReadyBannerTitle;
  readonly planReadyAction = APP_COPY.planReadyBannerAction;
  readonly planEmptyTitle = APP_COPY.planEmptyTitle;
  readonly planEmptyMessage = APP_COPY.planEmptyMessage;
  readonly planEmptyAction = APP_COPY.planEmptyAction;

  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly toast = inject(NutriToastService);
  private readonly analytics = inject(AnalyticsService);
  readonly generation = inject(MealPlanGenerationFacade);
  readonly portalData = inject(PortalDataStore);

  readonly loading = signal(true);
  readonly weekAdherence = signal<PlanAdherenceHistory | null>(null);
  readonly todayDateLabel = this.formatTodayDate();
  private lastGenerationPhase: GenerationPhase = 'idle';
  private refreshInFlight: Promise<void> | null = null;

  constructor() {
    effect(() => {
      const phase = this.generation.phase();
      if (phase === 'ready' && this.lastGenerationPhase !== 'ready') {
        void this.refreshFromStore(true);
      }
      this.lastGenerationPhase = phase;
    });
  }

  async ngOnInit(): Promise<void> {
    await this.refreshFromStore(false);
  }

  dismissPlanNotice(): void {
    this.generation.dismissReadyNotice();
  }

  private formatTodayDate(): string {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  private async refreshFromStore(force: boolean): Promise<void> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const showLoading = !this.portalData.todayCheckins();
    if (showLoading) {
      this.loading.set(true);
    }

    this.refreshInFlight = (async () => {
      try {
        await this.portalData.loadNutritionProfile(force);
        await this.portalData.loadTodayCheckins(force);
        await Promise.all([
          this.portalData.loadCheckinStats(force),
          this.loadWeekAdherence(),
        ]);
      } finally {
        if (showLoading) {
          this.loading.set(false);
        }
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }

  private async loadWeekAdherence(): Promise<void> {
    const checkins = this.portalData.todayCheckins();
    if (!checkins || (checkins.totalCount ?? checkins.meals?.length ?? 0) === 0) {
      this.weekAdherence.set(null);
      return;
    }
    try {
      this.weekAdherence.set(await this.nutritionRepo.getCheckinAdherence(7));
    } catch (e) {
      if (!isNotFound(e)) throw e;
      this.weekAdherence.set(null);
    }
  }

  calorieProgress(checkins: { totalIntakeCalories?: number; targetCalories?: number }): number {
    const target = checkins.targetCalories ?? 0;
    const intake = checkins.totalIntakeCalories ?? 0;
    if (target <= 0) return 0;
    return Math.min(120, Math.round((intake / target) * 100));
  }

  isOverTarget(checkins: { totalIntakeCalories?: number; targetCalories?: number }): boolean {
    const target = checkins.targetCalories;
    const intake = checkins.totalIntakeCalories ?? 0;
    return target != null && intake > target;
  }

  async toggleDone(mealId: number, mealName: string, status?: string): Promise<void> {
    if (status === 'DONE') {
      await withActionFeedback(
        this.toast,
        async () => {
          await this.nutritionRepo.deleteCheckin(mealId);
          this.portalData.invalidateCheckins();
          await this.refreshFromStore(true);
        },
        { success: `${mealName} desmarcada` },
      );
      return;
    }
    await this.markCheckin(mealId, 'DONE');
  }

  async markCheckin(mealId: number, status: string): Promise<void> {
    const meal = this.portalData.todayCheckins()?.meals.find((m) => m.mealId === mealId);
    const mealName = meal?.mealName ?? 'Refeição';
    const label = status === 'DONE' ? 'feita' : 'pulada';
    await withActionFeedback(
      this.toast,
      async () => {
        await this.nutritionRepo.saveCheckin(mealId, status);
        this.portalData.invalidateCheckins();
        await this.refreshFromStore(true);
        if (status === 'DONE') {
          this.analytics.trackCheckinDone(String(mealId));
        } else {
          this.analytics.trackCheckinSkipped(String(mealId));
        }
      },
      { success: `${mealName} marcada como ${label}` },
    );
  }

  async generate(): Promise<void> {
    await this.generation.generate('dashboard');
  }
}

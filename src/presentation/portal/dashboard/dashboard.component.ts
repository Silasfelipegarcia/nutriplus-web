import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriEmptyStateComponent } from '../../../design-system/nutri-empty-state/nutri-empty-state.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { NutritionProfile, TodayCheckins, CheckinStats } from '../../../domain/entities';
import { MealPlanGenerationFacade } from '../../core/meal-plan-generation.facade';
import { isNotFound } from '../../../infrastructure/http/api-error';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, NutriButtonComponent, NutriEmptyStateComponent, NutriInfoTipComponent],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Dashboard</h1>
        <p>Visão geral do seu dia e metas nutricionais.</p>
      </div>

    @if (generation.phase() === 'generating') {
      <div class="generating-banner">
        {{ generation.status()?.progressHint ?? 'Gerando seu plano alimentar...' }}
      </div>
    }

    @if (generation.phase() === 'failed' && generation.error()) {
      <div class="auth-card__error">{{ generation.error() }}</div>
    }

    @if (!checkins() && !loading() && profile()) {
      <nutri-info-tip
        message="Próximo passo: gere seu primeiro plano alimentar para começar os check-ins diários."
      />
    }

    @if (profile()) {
      <div class="macro-grid">
        <div class="macro-card"><strong>{{ profile()!.targetCalories | number:'1.0-0' }}</strong><span>kcal/dia</span></div>
        <div class="macro-card"><strong>{{ profile()!.targetProteinG | number:'1.0-0' }}g</strong><span>proteína</span></div>
        <div class="macro-card"><strong>{{ profile()!.targetCarbsG | number:'1.0-0' }}g</strong><span>carbos</span></div>
        <div class="macro-card"><strong>{{ profile()!.targetFatG | number:'1.0-0' }}g</strong><span>gordura</span></div>
      </div>
      @if (profile()!.athleteModeEnabled && profile()!.trainingDailyExtraKcal) {
        <p class="portal-card__lead" style="margin-top: 0.75rem">
          +{{ profile()!.trainingDailyExtraKcal | number:'1.0-0' }} kcal/dia de treino incluídas na meta.
        </p>
      }
    }

    @if (stats()) {
      <div class="stat-row">
        <div class="stat-card"><strong>{{ stats()!.weekAdherencePercent }}%</strong><span>Aderência semanal</span></div>
        <div class="stat-card"><strong>{{ stats()!.currentStreak ?? 0 }}</strong><span>Dias seguidos</span></div>
      </div>
    }

    @if (checkins()) {
      <section class="portal-section">
        <h2 class="portal-section__title">Check-ins de hoje</h2>
        <div class="checkin-list">
        @for (meal of checkins()!.meals; track meal.mealId) {
          <div class="checkin-item">
            <span>{{ meal.mealName }}</span>
            <div class="checkin-actions">
              <button
                type="button"
                class="checkin-btn"
                [class.checkin-btn--done]="meal.status === 'DONE'"
                (click)="markCheckin(meal.mealId, 'DONE')"
              >Feito</button>
              <button
                type="button"
                class="checkin-btn"
                [class.checkin-btn--done]="meal.status === 'SKIPPED'"
                (click)="markCheckin(meal.mealId, 'SKIPPED')"
              >Pulei</button>
            </div>
          </div>
        }
        </div>
      </section>
    } @else if (!loading()) {
      <nutri-empty-state
        icon="🍽️"
        title="Nenhum plano ainda"
        message="Gere seu primeiro plano alimentar para começar os check-ins."
      >
        <nutri-button variant="primary" (click)="generate()" [disabled]="generation.phase() === 'generating'">
          Gerar plano alimentar
        </nutri-button>
      </nutri-empty-state>
    }

    @if (loading()) {
      <p class="loading-text">Carregando...</p>
    }
    </div>
  `,
  styleUrl: '../portal.scss',
})
export class DashboardComponent implements OnInit {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly toast = inject(NutriToastService);
  readonly generation = inject(MealPlanGenerationFacade);

  readonly profile = signal<NutritionProfile | null>(null);
  readonly checkins = signal<TodayCheckins | null>(null);
  readonly stats = signal<CheckinStats | null>(null);
  readonly loading = signal(true);

  constructor() {
    effect(() => {
      if (this.generation.phase() === 'ready') {
        void this.load();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.generation.bootstrap();
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.profile.set(await this.nutritionRepo.getNutritionProfile());
    } catch {
      // no profile
    }
    try {
      this.checkins.set(await this.nutritionRepo.getTodayCheckins());
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
    try {
      this.stats.set(await this.nutritionRepo.getCheckinStats());
    } catch {
      // ignore
    }
    this.loading.set(false);
  }

  async markCheckin(mealId: number, status: string): Promise<void> {
    const meal = this.checkins()?.meals.find((m) => m.mealId === mealId);
    const mealName = meal?.mealName ?? 'Refeição';
    const label = status === 'DONE' ? 'feita' : 'pulada';
    await withActionFeedback(
      this.toast,
      async () => {
        await this.nutritionRepo.saveCheckin(mealId, status);
        await this.load();
      },
      { success: `${mealName} marcada como ${label}` },
    );
  }

  async generate(): Promise<void> {
    await this.generation.generate();
  }
}

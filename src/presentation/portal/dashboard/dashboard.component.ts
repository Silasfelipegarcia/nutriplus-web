import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriEmptyStateComponent } from '../../../design-system/nutri-empty-state/nutri-empty-state.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { MealPlanGenerationFacade } from '../../core/meal-plan-generation.facade';
import { PortalDataStore } from '../../core/portal-data.store';
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

    @if (!portalData.todayCheckins() && !loading() && portalData.nutritionProfile()) {
      <nutri-info-tip
        message="Próximo passo: gere seu primeiro plano alimentar para começar os check-ins diários."
      />
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

    @if (portalData.checkinStats(); as stats) {
      <div class="stat-row">
        <div class="stat-card"><strong>{{ stats.weekAdherencePercent }}%</strong><span>Aderência semanal</span></div>
        <div class="stat-card"><strong>{{ stats.currentStreak }}</strong><span>Dias seguidos</span></div>
      </div>
    }

    @if (portalData.todayCheckins(); as checkins) {
      <section class="portal-section">
        <h2 class="portal-section__title">Check-ins de hoje</h2>
        <div class="checkin-list">
        @for (meal of checkins.meals; track meal.mealId) {
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
  readonly portalData = inject(PortalDataStore);

  readonly loading = signal(true);

  constructor() {
    effect(() => {
      if (this.generation.phase() === 'ready') {
        void this.refreshFromStore(true);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.refreshFromStore(false);
  }

  private async refreshFromStore(force: boolean): Promise<void> {
    this.loading.set(true);
    await Promise.all([
      this.portalData.loadNutritionProfile(force),
      this.portalData.loadTodayCheckins(force),
      this.portalData.loadCheckinStats(force),
    ]);
    this.loading.set(false);
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
      },
      { success: `${mealName} marcada como ${label}` },
    );
  }

  async generate(): Promise<void> {
    await this.generation.generate();
  }
}

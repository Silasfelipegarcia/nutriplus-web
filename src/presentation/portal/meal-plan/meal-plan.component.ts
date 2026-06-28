import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NutriEmptyStateComponent } from '../../../design-system/nutri-empty-state/nutri-empty-state.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { DisclaimerBannerComponent } from '../../../design-system/disclaimer-banner/disclaimer-banner.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { MealPlan, MEAL_TYPE_LABELS, NutritionProfile } from '../../../domain/entities';
import { MealPlanGenerationFacade } from '../../core/meal-plan-generation.facade';
import { isNotFound } from '../../../infrastructure/http/api-error';
import { isPlanTargetOutOfSync, planTargetMismatchMessage } from '../../core/plan-target-sync';
import { PortalPageSkeletonComponent } from '../portal-page-skeleton.component';

@Component({
  selector: 'app-meal-plan',
  standalone: true,
  imports: [DecimalPipe, NutriEmptyStateComponent, NutriButtonComponent, DisclaimerBannerComponent, NutriInfoTipComponent, PortalPageSkeletonComponent],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Plano alimentar</h1>
        <p>Suas refeições do dia com macros detalhados.</p>
      </div>

    @if (generation.phase() === 'generating') {
      <div class="generating-banner">
        <p>{{ generation.status()?.progressHint ?? 'Gerando seu plano alimentar...' }}</p>
        @if (generation.status()?.progressStep && generation.status()?.progressTotalSteps) {
          <div class="generation-stepper" role="progressbar"
            [attr.aria-valuenow]="generation.status()!.progressStep"
            [attr.aria-valuemax]="generation.status()!.progressTotalSteps">
            <div class="generation-stepper__track">
              <div class="generation-stepper__fill"
                [style.width.%]="(generation.status()!.progressStep! / generation.status()!.progressTotalSteps!) * 100">
              </div>
            </div>
            <span class="generation-stepper__label">
              Etapa {{ generation.status()!.progressStep }} de {{ generation.status()!.progressTotalSteps }}
            </span>
          </div>
        }
      </div>
    }

    @if (generation.phase() === 'failed' && generation.error()) {
      <div class="auth-card__error">{{ generation.error() }}</div>
    }

    @if (planTargetMismatch()) {
      <nutri-info-tip [message]="planMismatchMessage()" />
      <div class="portal-actions" style="margin-top: 0.75rem; padding-top: 0; border: none">
        <nutri-button variant="primary" (click)="generate()" [disabled]="generation.phase() === 'generating'">
          Gerar novo plano
        </nutri-button>
      </div>
    }

    @if (plan()) {
      <div class="macro-grid">
        <div class="macro-card"><strong>{{ plan()!.totalCalories | number:'1.0-0' }}</strong><span>kcal total</span></div>
        <div class="macro-card"><strong>{{ plan()!.totalProteinG | number:'1.0-0' }}g</strong><span>proteína</span></div>
        <div class="macro-card"><strong>{{ plan()!.totalCarbsG | number:'1.0-0' }}g</strong><span>carbos</span></div>
        <div class="macro-card"><strong>{{ plan()!.totalFatG | number:'1.0-0' }}g</strong><span>gordura</span></div>
      </div>

      @for (meal of plan()!.meals; track meal.id ?? meal.name) {
        <div class="meal-section">
          <h3>{{ mealLabel(meal.mealType) }} — {{ meal.name }}</h3>
          @for (item of meal.items; track item.foodName) {
            <div class="meal-item-row">
              <span>{{ item.foodName }} ({{ item.quantityG }}g)</span>
              <span>{{ item.calories | number:'1.0-0' }} kcal</span>
            </div>
          }
        </div>
      }

      <nutri-disclaimer [text]="plan()!.disclaimer" />
    } @else if (!loading()) {
      <nutri-empty-state icon="🍽️" title="Sem plano gerado" message="Gere um plano alimentar para visualizar suas refeições.">
        <nutri-button variant="primary" (click)="generate()" [disabled]="generation.phase() === 'generating'">
          Gerar plano
        </nutri-button>
      </nutri-empty-state>
    }

    @if (loading()) {
      <app-portal-page-skeleton [cards]="2" [rows]="4" />
    }
    </div>
  `,
  styleUrl: '../portal.scss',
})
export class MealPlanComponent implements OnInit {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  readonly generation = inject(MealPlanGenerationFacade);

  readonly plan = signal<MealPlan | null>(null);
  readonly profile = signal<NutritionProfile | null>(null);
  readonly loading = signal(true);

  readonly planTargetMismatch = () =>
    isPlanTargetOutOfSync(this.plan()?.totalCalories, this.profile()?.targetCalories);

  readonly planMismatchMessage = () => {
    const p = this.profile();
    if (!p?.targetCalories) return '';
    return planTargetMismatchMessage(p.targetCalories, p.trainingDailyExtraKcal ?? null);
  };

  constructor() {
    effect(() => {
      if (this.generation.phase() === 'ready') {
        void this.load();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.load();
    this.generation.acknowledgeReady(
      this.plan()?.id ?? this.generation.status()?.mealPlanId,
    );
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.plan.set(await this.nutritionRepo.getLatestMealPlan());
    } catch (e) {
      if (!isNotFound(e)) throw e;
      this.plan.set(null);
    }
    try {
      this.profile.set(await this.nutritionRepo.getNutritionProfile());
    } catch (e) {
      if (!isNotFound(e)) throw e;
      this.profile.set(null);
    }
    this.loading.set(false);
  }

  mealLabel(type: string): string {
    return MEAL_TYPE_LABELS[type] ?? type;
  }

  async generate(): Promise<void> {
    await this.generation.generate('plano');
  }
}

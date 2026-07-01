import { Component, computed, inject } from '@angular/core';
import { APP_COPY } from '../../presentation/core/app-copy';
import { MealPlanGenerationFacade } from '../../presentation/core/meal-plan-generation.facade';

@Component({
  selector: 'app-plan-generating-banner',
  standalone: true,
  template: `
    @if (generation.phase() === 'generating') {
      <div class="generating-banner">
        <p class="generating-banner__title">{{ title }}</p>
        <p class="generating-banner__hint">{{ hint() }}</p>
        @if (step() && total()) {
          <div
            class="generation-stepper"
            role="progressbar"
            [attr.aria-valuenow]="step()"
            [attr.aria-valuemax]="total()"
          >
            <div class="generation-stepper__track">
              <div class="generation-stepper__fill" [style.width.%]="(step()! / total()!) * 100"></div>
            </div>
            <span class="generation-stepper__label">Etapa {{ step() }} de {{ total() }}</span>
          </div>
        } @else {
          <div class="generation-stepper__track generation-stepper__track--indeterminate"></div>
        }
        <p class="generating-banner__note">{{ note }}</p>
      </div>
    }
  `,
})
export class PlanGeneratingBannerComponent {
  readonly generation = inject(MealPlanGenerationFacade);

  readonly title = APP_COPY.planGeneratingTitle;
  readonly note = APP_COPY.planGeneratingNote;

  readonly hint = computed(
    () => this.generation.status()?.progressHint ?? APP_COPY.planGeneratingHint,
  );
  readonly step = computed(() => this.generation.status()?.progressStep ?? null);
  readonly total = computed(() => this.generation.status()?.progressTotalSteps ?? null);
}

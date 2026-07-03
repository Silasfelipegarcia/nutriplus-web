import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriConfirmSheetComponent } from '../../../design-system/nutri-confirm-sheet/nutri-confirm-sheet.component';
import { PlanRegenerationEligibility } from '../../../domain/entities';
import {
  canResetPlan,
  PLAN_RESET_CONFIRM_PHRASE,
  planRegenLockedMessage,
  PlanRegenerationReasons,
  planResetConsequences,
  planResetIntroMessage,
} from '../../core/plan-regeneration';
import { MealPlanGenerationFacade } from '../../core/meal-plan-generation.facade';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { parseApiError } from '../../../infrastructure/http/api-error';

@Component({
  selector: 'app-plan-reset-entry',
  standalone: true,
  imports: [CommonModule, RouterLink, NutriButtonComponent, NutriConfirmSheetComponent],
  template: `
    @if (eligibility() && canResetPlan(eligibility())) {
      <nutri-button
        [variant]="buttonVariant()"
        [size]="buttonSize()"
        [block]="block()"
        (click)="openConfirm()"
      >
        {{ buttonLabel() }}
      </nutri-button>

      <nutri-confirm-sheet
        [open]="confirmOpen()"
        title="Zerar plano e começar de novo"
        cancelLabel="Cancelar"
        confirmLabel="Zerar e gerar novo plano"
        checkboxLabel="Li e concordo que perderei os dados salvos deste plano."
        [typedConfirmPhrase]="planResetPhrase"
        typedConfirmLabel="Digite"
        [processing]="processing()"
        (confirmed)="confirmReset()"
        (dismissed)="closeConfirm()"
      >
        <p class="plan-reset-entry__intro">{{ planResetIntroMessage() }}</p>
        <ul class="plan-reset-entry__list">
          @for (line of planResetConsequences(eligibility()!); track line) {
            <li>{{ line }}</li>
          }
        </ul>
        @if (eligibility()?.currentPlanStarted) {
          <p class="plan-reset-entry__warn">
            {{ eligibility()!.currentPlanCheckinCount ?? 0 }} registro(s) de check-in
            em {{ eligibility()!.currentPlanDaysActive ?? 0 }} dia(s) neste plano.
          </p>
        }
        <p class="plan-reset-entry__edit">
          Ajuste seu perfil antes de continuar, se necessário:
          <a routerLink="/app/perfil/editar/metricas">medidas</a>,
          <a routerLink="/app/perfil/editar/saude">dieta e rotina</a>.
        </p>
      </nutri-confirm-sheet>
    }
  `,
  styles: `
    .plan-reset-entry__intro {
      margin: 0 0 0.75rem;
      color: #374151;
      line-height: 1.45;
      font-size: 0.92rem;
    }
    .plan-reset-entry__list {
      margin: 0 0 0.85rem;
      padding-left: 1.1rem;
      color: #374151;
      line-height: 1.45;
      font-size: 0.9rem;
    }
    .plan-reset-entry__warn {
      margin: 0 0 0.85rem;
      color: #b45309;
      font-size: 0.88rem;
      line-height: 1.4;
    }
    .plan-reset-entry__edit {
      margin: 0 0 0.25rem;
      font-size: 0.86rem;
      color: var(--nutri-text-muted, #6b7280);
      line-height: 1.45;
    }
    .plan-reset-entry__edit a {
      color: var(--nutri-brand, #059669);
    }
  `,
})
export class PlanResetEntryComponent {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly generation = inject(MealPlanGenerationFacade);
  private readonly toast = inject(NutriToastService);

  readonly eligibility = input<PlanRegenerationEligibility | null>(null);
  readonly source = input('unknown');
  readonly buttonLabel = input('Zerar plano e gerar outro');
  readonly buttonVariant = input<'primary' | 'secondary' | 'outline' | 'ghost'>('outline');
  readonly buttonSize = input<'sm' | 'md'>('md');
  readonly block = input(false);

  readonly resetStarted = output<void>();

  readonly confirmOpen = signal(false);
  readonly processing = signal(false);

  readonly planResetPhrase = PLAN_RESET_CONFIRM_PHRASE;
  readonly canResetPlan = canResetPlan;
  readonly planResetIntroMessage = planResetIntroMessage;
  readonly planResetConsequences = planResetConsequences;

  openConfirm(): void {
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    if (this.processing()) return;
    this.confirmOpen.set(false);
  }

  async confirmReset(): Promise<void> {
    if (this.processing()) return;
    this.processing.set(true);
    try {
      let eligibility = this.eligibility();
      if (!eligibility) {
        eligibility = await this.nutritionRepo.getPlanRegenerationEligibility();
      }
      if (!canResetPlan(eligibility)) {
        this.toast.error(planRegenLockedMessage(eligibility));
        this.closeConfirm();
        return;
      }
      const ok = await this.generation.generate(this.source(), {
        explicitReason: PlanRegenerationReasons.planReset,
      });
      if (ok) {
        this.resetStarted.emit();
        this.closeConfirm();
      }
    } catch (e) {
      this.toast.error(parseApiError(e).message);
    } finally {
      this.processing.set(false);
    }
  }
}

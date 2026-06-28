import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { NutriEmptyStateComponent } from '../../../design-system/nutri-empty-state/nutri-empty-state.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { isNotFound } from '../../../infrastructure/http/api-error';
import { PortalDataStore } from '../../core/portal-data.store';
import { PortalPageSkeletonComponent } from '../portal-page-skeleton.component';
import {
  buildShoppingFinanceSnapshot,
  formatBrl,
  formatBrlRange,
  ShoppingFinanceSnapshot,
} from '../../core/shopping-finance';

@Component({
  selector: 'app-shopping-finance',
  standalone: true,
  imports: [RouterLink, NutriEmptyStateComponent, NutriButtonComponent, PortalPageSkeletonComponent],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Economia</h1>
        <p>Projeções de gasto com alimentação e economia com trocas inteligentes no mercado.</p>
      </div>

      @if (snapshot()) {
        <section class="portal-section finance-hero">
          <div class="finance-hero__card">
            <h2 class="portal-section__title">Visão financeira</h2>
            <p class="portal-card__lead">
              Perfil {{ snapshot()!.budgetLevel.toLowerCase() }} · lista da semana
            </p>
            @if (weekPeriodLabel()) {
              <p class="finance-hero__period">{{ weekPeriodLabel() }}</p>
            }
          </div>
        </section>

        <div class="macro-grid finance-metrics">
          <div class="finance-metric">
            <span class="finance-metric__label">Semana (faixa)</span>
            <strong>{{ formatBrlRange(snapshot()!.budgetReference.weeklyMinCents, snapshot()!.budgetReference.weeklyMaxCents) }}</strong>
            <span class="finance-metric__hint">Referência para 1 pessoa</span>
          </div>
          <div class="finance-metric">
            <span class="finance-metric__label">Semana ajustada</span>
            <strong>{{ formatBrl(snapshot()!.adjustedWeeklyMidCents) }}</strong>
            <span class="finance-metric__hint">
              {{ snapshot()!.appliedSavingsCents > 0 ? 'Com trocas aplicadas' : 'Estimativa central' }}
            </span>
          </div>
          <div class="finance-metric">
            <span class="finance-metric__label">Mês projetado</span>
            <strong>{{ formatBrl(snapshot()!.adjustedMonthlyCents) }}</strong>
            <span class="finance-metric__hint">4 semanas</span>
          </div>
          <div class="finance-metric">
            <span class="finance-metric__label">Ano projetado</span>
            <strong>{{ formatBrl(snapshot()!.adjustedYearlyCents) }}</strong>
            <span class="finance-metric__hint">52 semanas</span>
          </div>
        </div>

        <section class="portal-section finance-savings">
          <h2 class="portal-section__title">Economia com compras inteligentes</h2>
          @if (snapshot()!.appliedSavingsCents > 0) {
            <p class="finance-savings__value">{{ formatBrl(snapshot()!.appliedSavingsCents) }}/semana</p>
            <p class="portal-card__lead">
              Projeção anual: {{ formatBrl(snapshot()!.projectedYearlySavingsCents) }}
              ({{ snapshot()!.smartSwapCount }}
              {{ snapshot()!.smartSwapCount === 1 ? 'troca aplicada' : 'trocas aplicadas' }})
            </p>
          } @else {
            <p class="portal-card__lead">Ainda não há trocas econômicas confirmadas nesta lista.</p>
          }
          @if (snapshot()!.potentialSavingsCents > 0) {
            <p class="finance-savings__potential">
              Você pode economizar mais {{ formatBrl(snapshot()!.potentialSavingsCents) }}/semana
              revisando {{ snapshot()!.pendingSwapCount }}
              {{ snapshot()!.pendingSwapCount === 1 ? 'troca pendente' : 'trocas pendentes' }}.
            </p>
            <a routerLink="/app/compras" class="finance-savings__link">Ver lista de compras</a>
          }
        </section>

        @if (snapshot()!.weeklyImpactSummary) {
          <section class="portal-section">
            <h2 class="portal-section__title">Impacto no objetivo</h2>
            <p class="portal-card__lead">{{ snapshot()!.weeklyImpactSummary }}</p>
          </section>
        }

        @if (snapshot()!.budgetSummary) {
          <section class="portal-section">
            <h2 class="portal-section__title">Como o plano usa seu orçamento</h2>
            <p class="portal-card__lead">{{ snapshot()!.budgetSummary }}</p>
          </section>
        }

        @if (snapshot()!.swapLines.length) {
          <section class="portal-section">
            <h2 class="portal-section__title">Trocas que rendem</h2>
            <div class="finance-swaps">
              @for (line of snapshot()!.swapLines; track line.itemName + line.selectedLabel) {
                <div class="finance-swaps__item">
                  <strong>{{ line.itemName }}</strong>
                  <span>
                    @if (line.applied) {
                      {{ line.selectedLabel }} · economia estimada {{ formatBrl(line.savingsCents) }}/semana
                    } @else {
                      Sugestão: {{ line.selectedLabel }} · até {{ formatBrl(line.savingsCents) }}/semana
                    }
                  </span>
                </div>
              }
            </div>
          </section>
        }

        <p class="finance-disclaimer">
          Valores são estimativas de referência com base no seu perfil de orçamento e nas trocas do plano.
          Use como bússola — não substituem seu extrato ou recibo de mercado.
        </p>
      } @else if (!loading() && empty()) {
        <nutri-empty-state
          icon="💰"
          title="Economia indisponível"
          message="Gere seu plano alimentar para ver projeções de gasto e economia com trocas no mercado."
        >
          <nutri-button variant="primary" to="/app/plano">Gerar plano alimentar</nutri-button>
        </nutri-empty-state>
      }

      @if (loading()) {
        <app-portal-page-skeleton [cards]="3" [rows]="2" />
      }
    </div>
  `,
  styles: `
    .finance-hero__card {
      padding: 1rem 1.25rem;
      border-radius: var(--nutri-radius-sm);
      background: color-mix(in srgb, var(--nutri-brand) 8%, white);
      border: 1px solid color-mix(in srgb, var(--nutri-brand) 18%, white);
    }

    .finance-hero__period {
      margin: 0.35rem 0 0;
      font-size: 0.9rem;
      color: var(--nutri-ink-muted);
    }

    .finance-metrics {
      margin-top: 1rem;
    }

    .finance-metric {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem;
      border-radius: var(--nutri-radius-sm);
      background: white;
      border: 1px solid var(--nutri-border);
    }

    .finance-metric__label {
      font-size: 0.85rem;
      color: var(--nutri-ink-muted);
    }

    .finance-metric strong {
      font-size: 1.05rem;
    }

    .finance-metric__hint {
      font-size: 0.8rem;
      color: var(--nutri-ink-muted);
    }

    .finance-savings__value {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--nutri-brand);
    }

    .finance-savings__potential {
      margin: 0.75rem 0 0;
      color: var(--nutri-ink-muted);
    }

    .finance-savings__link {
      display: inline-block;
      margin-top: 0.75rem;
      color: var(--nutri-brand);
      font-weight: 600;
      text-decoration: none;
    }

    .finance-swaps {
      display: grid;
      gap: 0.75rem;
    }

    .finance-swaps__item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.875rem 1rem;
      border-radius: var(--nutri-radius-sm);
      border: 1px solid var(--nutri-border);
      background: white;
    }

    .finance-swaps__item span {
      font-size: 0.9rem;
      color: var(--nutri-ink-muted);
    }

    .finance-disclaimer {
      margin: 1.5rem 0 0;
      font-size: 0.85rem;
      color: var(--nutri-ink-muted);
      text-align: center;
    }
  `,
  styleUrl: '../portal.scss',
})
export class ShoppingFinanceComponent implements OnInit {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly portalData = inject(PortalDataStore);

  readonly loading = signal(true);
  readonly empty = signal(false);
  readonly snapshot = signal<ShoppingFinanceSnapshot | null>(null);
  readonly formatBrl = formatBrl;
  readonly formatBrlRange = formatBrlRange;

  weekPeriodLabel(): string | null {
    const snap = this.snapshot();
    if (!snap?.weekStart || !snap.weekEnd) return null;
    return `Período: ${this.formatDate(snap.weekStart)} – ${this.formatDate(snap.weekEnd)}`;
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      await this.portalData.loadNutritionProfile(false);
      const profile = this.portalData.nutritionProfile();
      let list = null;
      try {
        list = await this.nutritionRepo.getLatestShoppingList();
      } catch (e) {
        if (!isNotFound(e)) throw e;
        this.empty.set(true);
        this.snapshot.set(null);
        return;
      }
      this.empty.set(false);
      this.snapshot.set(
        buildShoppingFinanceSnapshot({
          foodBudgetLevel: profile?.foodBudgetLevel,
          list,
        }),
      );
    } finally {
      this.loading.set(false);
    }
  }
}

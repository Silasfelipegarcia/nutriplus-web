import { Component, input, output } from '@angular/core';
import { ShoppingListItem } from '../../../domain/entities';
import { shoppingItemHasDetailContent } from '../../core/shopping-list-helpers';

@Component({
  selector: 'app-shopping-item-detail',
  standalone: true,
  template: `
    @if (item(); as current) {
      <div class="shopping-detail-overlay" (click)="fechar.emit()" role="presentation">
        <div
          class="shopping-detail-sheet"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'shopping-detail-' + current.itemName"
          (click)="$event.stopPropagation()"
        >
          <header class="shopping-detail-sheet__header">
            <h2 [id]="'shopping-detail-' + current.itemName">{{ current.itemName }}</h2>
            <button type="button" class="shopping-detail-sheet__close" (click)="fechar.emit()" aria-label="Fechar">
              ×
            </button>
          </header>

          <div class="shopping-detail-sheet__meta">
            @if (current.category) {
              <span class="shopping-detail-sheet__chip">{{ current.category }}</span>
            }
            <span class="shopping-detail-sheet__qty">{{ current.quantity }}</span>
          </div>

          @if (current.kcalEstimate != null || current.proteinLeanness) {
            <section class="shopping-detail-sheet__section">
              <h3>Informação nutricional</h3>
              @if (current.kcalEstimate != null) {
                <p>~{{ current.kcalEstimate }} kcal/100g</p>
              }
              @if (current.proteinLeanness) {
                <p>Perfil proteico: {{ current.proteinLeanness }}</p>
              }
            </section>
          }

          @if (current.explanation?.trim()) {
            <section class="shopping-detail-sheet__section">
              <h3>Por que está no plano</h3>
              <p>{{ current.explanation }}</p>
            </section>
          }

          @if (current.swapOptions?.length) {
            <section class="shopping-detail-sheet__section">
              <h3>Opções no mercado</h3>
              @for (opt of current.swapOptions!; track opt.id) {
                <div
                  class="shopping-detail-sheet__swap"
                  [class.shopping-detail-sheet__swap--selected]="opt.id === current.selectedSwapId"
                >
                  <strong>
                    {{ opt.label }}
                    @if (opt.id === current.recommendedOptionId) { (mais barato) }
                    @if (opt.id === current.selectedSwapId) { — sua escolha }
                  </strong>
                  @if (opt.whyCheaper) {
                    <span>{{ opt.whyCheaper }}</span>
                  }
                  @if (opt.kcalEstimate != null) {
                    <span>~{{ opt.kcalEstimate }} kcal/100g</span>
                  }
                </div>
              }
            </section>
          } @else if (current.alternatives?.length) {
            <section class="shopping-detail-sheet__section">
              <h3>Alternativas no mercado</h3>
              <ul>
                @for (alt of current.alternatives!; track alt) {
                  <li>{{ alt }}</li>
                }
              </ul>
            </section>
          }

          @if (current.marketTips?.length) {
            <section class="shopping-detail-sheet__section">
              <h3>Dicas de mercado</h3>
              <ul>
                @for (tip of current.marketTips!; track tip) {
                  <li>{{ tip }}</li>
                }
              </ul>
            </section>
          }

          @if (!shoppingItemHasDetailContent(current)) {
            <p class="shopping-detail-sheet__empty">
              Gere um novo plano para ver calorias e alternativas deste item.
            </p>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .shopping-detail-overlay {
      position: fixed;
      inset: 0;
      z-index: 1200;
      background: rgba(15, 23, 42, 0.45);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 1rem;
    }

    .shopping-detail-sheet {
      width: min(520px, 100%);
      max-height: min(85vh, 720px);
      overflow: auto;
      background: #fff;
      border-radius: 16px 16px 12px 12px;
      padding: 1.1rem 1.25rem 1.35rem;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
    }

    .shopping-detail-sheet__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.65rem;
    }

    .shopping-detail-sheet__header h2 {
      margin: 0;
      font-size: 1.2rem;
    }

    .shopping-detail-sheet__close {
      border: none;
      background: transparent;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      color: var(--nutri-ink-muted, #6b7280);
      padding: 0.15rem 0.35rem;
    }

    .shopping-detail-sheet__meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 0.75rem;
      margin-bottom: 0.85rem;
    }

    .shopping-detail-sheet__chip {
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      background: #f3f4f6;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .shopping-detail-sheet__qty {
      color: var(--nutri-ink-muted, #6b7280);
      font-size: 0.9rem;
    }

    .shopping-detail-sheet__section {
      margin-top: 1rem;
    }

    .shopping-detail-sheet__section h3 {
      margin: 0 0 0.35rem;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--nutri-ink-muted, #6b7280);
    }

    .shopping-detail-sheet__section p,
    .shopping-detail-sheet__section li {
      margin: 0.2rem 0;
      font-size: 0.92rem;
      line-height: 1.45;
    }

    .shopping-detail-sheet__section ul {
      margin: 0;
      padding-left: 1.1rem;
    }

    .shopping-detail-sheet__swap {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 0.55rem 0;
      border-bottom: 1px solid var(--nutri-border, #e5e7eb);
      font-size: 0.9rem;
    }

    .shopping-detail-sheet__swap:last-child {
      border-bottom: none;
    }

    .shopping-detail-sheet__swap--selected strong {
      color: var(--nutri-brand, #3d8b5f);
    }

    .shopping-detail-sheet__swap span {
      color: var(--nutri-ink-muted, #6b7280);
      font-size: 0.85rem;
    }

    .shopping-detail-sheet__empty {
      margin: 1rem 0 0;
      color: var(--nutri-ink-muted, #6b7280);
      font-size: 0.9rem;
    }

    @media (min-width: 640px) {
      .shopping-detail-overlay {
        align-items: center;
      }

      .shopping-detail-sheet {
        border-radius: 16px;
      }
    }
  `,
})
export class ShoppingItemDetailComponent {
  readonly item = input<ShoppingListItem | null>(null);
  readonly fechar = output<void>();
  readonly shoppingItemHasDetailContent = shoppingItemHasDetailContent;
}

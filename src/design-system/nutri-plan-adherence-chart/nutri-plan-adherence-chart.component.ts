import { Component, input, output } from '@angular/core';
import { DailyAdherencePoint } from '../../domain/entities';
import {
  formatAdherenceDayLabel,
  PLAN_DAY_STATUS_COLORS,
  PLAN_DAY_STATUS_LABELS,
  planAdherenceEstimateDisclaimer,
} from '../../presentation/core/plan-adherence';

@Component({
  selector: 'nutri-plan-adherence-chart',
  standalone: true,
  template: `
    <section class="plan-chart">
      <div class="plan-chart__header">
        <h3>Calorias por dia</h3>
        <p>Barras = intake · linha = meta</p>
      </div>

      @if (daily().length === 0) {
        <p class="plan-chart__empty">Marque refeições para ver sua evolução.</p>
      } @else {
        <div class="plan-chart__plot" [style.--target-y]="targetLinePercent() + '%'">
          @if (targetCalories()) {
            <div class="plan-chart__target-line">
              <span>{{ targetCalories() }} kcal</span>
            </div>
          }
          <div class="plan-chart__bars">
            @for (day of daily(); track day.date) {
              <button
                type="button"
                class="plan-chart__bar-wrap"
                (click)="daySelect.emit(day)"
                [attr.aria-label]="formatAdherenceDayLabel(day.date)"
              >
                <div
                  class="plan-chart__bar"
                  [style.height.%]="barHeight(day)"
                  [style.background]="barColor(day.dayStatus)"
                ></div>
                <span class="plan-chart__label">{{ shortLabel(day.date) }}</span>
              </button>
            }
          </div>
        </div>

        <div class="plan-chart__legend">
          @for (item of legend; track item.key) {
            <span><i [style.background]="item.color"></i>{{ item.label }}</span>
          }
        </div>
      }

      @if (showDisclaimer()) {
        <p class="plan-chart__disclaimer">{{ disclaimerText }}</p>
      }
    </section>
  `,
  styles: `
    .plan-chart {
      display: grid;
      gap: 0.75rem;
    }

    .plan-chart__header h3 {
      margin: 0;
      font-size: 1rem;
    }

    .plan-chart__header p,
    .plan-chart__empty,
    .plan-chart__disclaimer {
      margin: 0;
      font-size: 0.85rem;
      color: var(--nutri-ink-muted);
    }

    .plan-chart__plot {
      position: relative;
      min-height: 180px;
      padding-top: 1.25rem;
    }

    .plan-chart__target-line {
      position: absolute;
      left: 0;
      right: 0;
      top: var(--target-y, 50%);
      border-top: 2px dashed color-mix(in srgb, var(--nutri-brand) 55%, transparent);
      pointer-events: none;
    }

    .plan-chart__target-line span {
      position: absolute;
      right: 0;
      top: -1.1rem;
      font-size: 0.72rem;
      color: var(--nutri-brand);
    }

    .plan-chart__bars {
      display: flex;
      align-items: flex-end;
      gap: 0.35rem;
      height: 160px;
    }

    .plan-chart__bar-wrap {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      padding: 0;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      height: 100%;
    }

    .plan-chart__bar {
      width: 100%;
      max-width: 28px;
      min-height: 4px;
      border-radius: 4px 4px 0 0;
      transition: opacity 0.15s;
    }

    .plan-chart__bar-wrap:hover .plan-chart__bar {
      opacity: 0.85;
    }

    .plan-chart__label {
      margin-top: 0.35rem;
      font-size: 0.65rem;
      color: var(--nutri-ink-muted);
      white-space: nowrap;
    }

    .plan-chart__legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.78rem;
    }

    .plan-chart__legend i {
      display: inline-block;
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 999px;
      margin-right: 0.25rem;
    }
  `,
})
export class NutriPlanAdherenceChartComponent {
  readonly daily = input.required<DailyAdherencePoint[]>();
  readonly targetCalories = input<number | undefined>();
  readonly showDisclaimer = input(true);
  readonly daySelect = output<DailyAdherencePoint>();

  readonly disclaimerText = planAdherenceEstimateDisclaimer;
  readonly formatAdherenceDayLabel = formatAdherenceDayLabel;

  readonly legend = [
    { key: 'ON_TRACK', label: PLAN_DAY_STATUS_LABELS['ON_TRACK'], color: PLAN_DAY_STATUS_COLORS['ON_TRACK'] },
    { key: 'PARTIAL', label: PLAN_DAY_STATUS_LABELS['PARTIAL'], color: PLAN_DAY_STATUS_COLORS['PARTIAL'] },
    { key: 'OVER', label: PLAN_DAY_STATUS_LABELS['OVER'], color: PLAN_DAY_STATUS_COLORS['OVER'] },
    { key: 'NO_DATA', label: PLAN_DAY_STATUS_LABELS['NO_DATA'], color: PLAN_DAY_STATUS_COLORS['NO_DATA'] },
  ];

  barColor(status: string): string {
    return PLAN_DAY_STATUS_COLORS[status] ?? PLAN_DAY_STATUS_COLORS['NO_DATA'];
  }

  barHeight(day: DailyAdherencePoint): number {
    const max = this.maxIntake();
    if (max <= 0 || day.dayStatus === 'NO_DATA') return 4;
    return Math.max(8, Math.round((day.totalIntakeCalories / max) * 100));
  }

  targetLinePercent(): number {
    const target = this.targetCalories();
    const max = this.maxIntake();
    if (!target || max <= 0) return 50;
    return Math.max(8, Math.min(92, 100 - (target / max) * 100));
  }

  shortLabel(iso: string): string {
    const d = new Date(iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  private maxIntake(): number {
    const target = this.targetCalories() ?? 0;
    const peak = this.daily().reduce((m, d) => Math.max(m, d.totalIntakeCalories), 0);
    return Math.max(target, peak, 500);
  }
}

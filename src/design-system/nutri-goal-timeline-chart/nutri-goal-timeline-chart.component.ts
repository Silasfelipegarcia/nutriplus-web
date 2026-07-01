import { Component, computed, input } from '@angular/core';
import { GoalTimeline } from '../../domain/entities';
import { goalTimelinePaceColor } from '../../presentation/core/plan-adherence';

interface PlotPoint {
  x: number;
  y: number;
}

interface PlotLine {
  points: PlotPoint[];
  color: string;
  dashed?: boolean;
  strokeWidth?: number;
}

@Component({
  selector: 'nutri-goal-timeline-chart',
  standalone: true,
  template: `
    @if (!layout()) {
      <p class="goal-chart__empty">Registre peso e check-ins no plano atual para ver a curva da meta.</p>
    } @else {
      <div class="goal-chart">
        <svg class="goal-chart__svg" viewBox="0 0 360 200" preserveAspectRatio="none" role="img" aria-label="Gráfico de previsão da meta de peso">
          @for (grid of horizontalGrids(); track grid) {
            <line x1="40" [attr.y1]="grid" x2="350" [attr.y2]="grid" class="goal-chart__grid" />
          }
          @if (targetY() != null) {
            <line x1="40" [attr.y1]="targetY()" x2="350" [attr.y2]="targetY()" class="goal-chart__target" />
            <text x="352" [attr.y]="targetY()! + 4" class="goal-chart__target-label">Meta</text>
          }
          @for (marker of planMarkers(); track marker.x) {
            <line [attr.x1]="marker.x" y1="16" [attr.x2]="marker.x" y2="184" class="goal-chart__plan-marker" />
          }
          @if (currentPlanMarkerX() != null) {
            <line [attr.x1]="currentPlanMarkerX()" y1="16" [attr.x2]="currentPlanMarkerX()" y2="184" class="goal-chart__current-plan" />
          }
          @for (line of lines(); track line.color + line.points.length) {
            <polyline
              [attr.points]="polylinePoints(line.points)"
              fill="none"
              [attr.stroke]="line.color"
              [attr.stroke-width]="line.strokeWidth ?? 2"
              [attr.stroke-dasharray]="line.dashed ? '6 4' : null"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          }
          @for (dot of dots(); track dot.x + '-' + dot.y) {
            <circle [attr.cx]="dot.x" [attr.cy]="dot.y" r="3.5" [attr.fill]="dot.color" />
          }
        </svg>
        <div class="goal-chart__x-labels">
          @for (label of xLabels(); track label.x) {
            <span [style.left.%]="label.pct">{{ label.text }}</span>
          }
        </div>
        <div class="goal-chart__legend">
          <span><i class="goal-chart__swatch goal-chart__swatch--muted"></i>Histórico</span>
          <span><i class="goal-chart__swatch goal-chart__swatch--brand"></i>Plano atual</span>
          <span><i class="goal-chart__swatch goal-chart__swatch--pace"></i>Ritmo da meta</span>
          <span><i class="goal-chart__swatch" [style.background]="paceColor()"></i>Previsão</span>
        </div>
      </div>
    }
  `,
  styles: `
    .goal-chart { display: grid; gap: 0.5rem; }
    .goal-chart__empty { margin: 0; font-size: 0.85rem; color: var(--nutri-ink-muted); }
    .goal-chart__svg {
      width: 100%;
      height: 220px;
      background: linear-gradient(180deg, rgba(61, 139, 95, 0.04) 0%, transparent 100%);
      border-radius: var(--nutri-radius-sm);
    }
    .goal-chart__grid { stroke: var(--nutri-border); stroke-width: 1; }
    .goal-chart__target { stroke: rgba(61, 139, 95, 0.45); stroke-width: 1.5; stroke-dasharray: 6 4; }
    .goal-chart__target-label { font-size: 8px; fill: var(--nutri-ink-muted); }
    .goal-chart__plan-marker { stroke: rgba(230, 81, 0, 0.45); stroke-width: 1.5; stroke-dasharray: 4 4; }
    .goal-chart__current-plan { stroke: rgba(61, 139, 95, 0.35); stroke-width: 2; }
    .goal-chart__x-labels {
      position: relative;
      height: 1.1rem;
      margin: 0 2.5rem 0 2.2rem;
      font-size: 0.65rem;
      color: var(--nutri-ink-muted);
    }
    .goal-chart__x-labels span { position: absolute; transform: translateX(-50%); white-space: nowrap; }
    .goal-chart__legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem 1rem;
      font-size: 0.7rem;
      color: var(--nutri-ink-muted);
    }
    .goal-chart__legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
    .goal-chart__swatch {
      display: inline-block;
      width: 14px;
      height: 3px;
      border-radius: 2px;
    }
    .goal-chart__swatch--muted { background: #9ca3af; }
    .goal-chart__swatch--brand { background: var(--nutri-brand); }
    .goal-chart__swatch--pace {
      background: repeating-linear-gradient(90deg, #6b7280 0 5px, transparent 5px 9px);
    }
  `,
})
export class NutriGoalTimelineChartComponent {
  readonly timeline = input.required<GoalTimeline>();

  private readonly plot = computed(() => buildGoalTimelinePlot(this.timeline()));

  readonly layout = computed(() => this.plot().layout);
  readonly lines = computed(() => this.plot().lines);
  readonly dots = computed(() => this.plot().dots);
  readonly xLabels = computed(() => this.plot().xLabels);
  readonly horizontalGrids = computed(() => this.plot().horizontalGrids);
  readonly targetY = computed(() => this.plot().targetY);
  readonly planMarkers = computed(() => this.plot().planMarkers);
  readonly currentPlanMarkerX = computed(() => this.plot().currentPlanMarkerX);
  readonly paceColor = computed(() => goalTimelinePaceColor(this.timeline().paceStatus));

  polylinePoints(points: PlotPoint[]): string {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }
}

function parseDate(raw?: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayIndex(d: Date): number {
  return Math.floor(d.getTime() / 86400000);
}

function buildGoalTimelinePlot(timeline: GoalTimeline) {
  const dates: Date[] = [];
  const add = (raw?: string) => {
    const d = parseDate(raw);
    if (d) dates.push(d);
  };
  for (const p of timeline.weightHistory ?? []) add(p.date);
  for (const p of timeline.requiredPaceLine ?? []) add(p.date);
  for (const p of timeline.projectionLine ?? []) add(p.date);
  add(timeline.journeyStartDate);
  add(timeline.targetDate);
  add(timeline.projectedFinishDate);
  add(timeline.currentPlanStartDate);

  if (dates.length === 0) {
    return {
      layout: null as null,
      lines: [] as PlotLine[],
      dots: [] as { x: number; y: number; color: string }[],
      xLabels: [] as { x: number; pct: number; text: string }[],
      horizontalGrids: [] as number[],
      targetY: null as number | null,
      planMarkers: [] as { x: number }[],
      currentPlanMarkerX: null as number | null,
    };
  }

  dates.sort((a, b) => a.getTime() - b.getTime());
  const minDay = dayIndex(dates[0]);
  const maxDay = dayIndex(dates[dates.length - 1]);
  const span = Math.max(maxDay - minDay, 1);

  const left = 40;
  const right = 350;
  const top = 16;
  const bottom = 184;
  const width = right - left;
  const height = bottom - top;

  const yValues: number[] = [];
  const collectY = (v?: number) => {
    if (v != null) yValues.push(v);
  };
  for (const p of timeline.weightHistory ?? []) collectY(p.weightKg);
  for (const p of timeline.requiredPaceLine ?? []) collectY(p.weightKg);
  for (const p of timeline.projectionLine ?? []) collectY(p.weightKg);
  collectY(timeline.targetWeightKg);
  collectY(timeline.startWeightKg);

  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const pad = Math.max((maxY - minY) * 0.12, 0.5);
  const chartMin = minY - pad;
  const chartMax = maxY + pad;
  const ySpan = Math.max(chartMax - chartMin, 0.1);

  const xFor = (d: Date) => left + ((dayIndex(d) - minDay) / span) * width;
  const yFor = (v: number) => bottom - ((v - chartMin) / ySpan) * height;

  const toPoints = (items: { date: string; weightKg: number }[]): PlotPoint[] =>
    items
      .map((p) => {
        const d = parseDate(p.date);
        return d ? { x: xFor(d), y: yFor(p.weightKg) } : null;
      })
      .filter((p): p is PlotPoint => p != null)
      .sort((a, b) => a.x - b.x);

  const prior = toPoints((timeline.weightHistory ?? []).filter((p) => !p.currentPlanPeriod));
  const current = toPoints((timeline.weightHistory ?? []).filter((p) => p.currentPlanPeriod));
  const pace = toPoints(timeline.requiredPaceLine ?? []);
  const projection = toPoints(timeline.projectionLine ?? []);

  const lines: PlotLine[] = [];
  if (prior.length >= 2) lines.push({ points: prior, color: '#9ca3af', strokeWidth: 2 });
  if (current.length >= 1) lines.push({ points: current, color: 'var(--nutri-brand)', strokeWidth: 3 });
  if (pace.length >= 2) lines.push({ points: pace, color: '#6b7280', dashed: true });
  if (projection.length >= 2) {
    lines.push({ points: projection, color: goalTimelinePaceColor(timeline.paceStatus), dashed: true, strokeWidth: 2.5 });
  }

  const dots = current.length === 1 ? [{ x: current[0].x, y: current[0].y, color: 'var(--nutri-brand)' }] : [];

  const xLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const day = minDay + Math.round(span * ratio);
    const d = new Date(day * 86400000);
    const text = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const x = left + ratio * width;
    return { x, pct: (x / 360) * 100, text };
  });

  const horizontalGrids = [0.25, 0.5, 0.75].map((r) => top + r * height);
  const targetY = timeline.targetWeightKg != null ? yFor(timeline.targetWeightKg) : null;

  const planMarkers = (timeline.planEras ?? [])
    .filter((e) => !e.current)
    .map((e) => parseDate(e.startDate))
    .filter((d): d is Date => d != null)
    .map((d) => ({ x: xFor(d) }));

  const currentStart = parseDate(timeline.currentPlanStartDate ?? timeline.journeyStartDate);
  const currentPlanMarkerX = currentStart ? xFor(currentStart) : null;

  return {
    layout: { minDay, maxDay },
    lines,
    dots,
    xLabels,
    horizontalGrids,
    targetY,
    planMarkers,
    currentPlanMarkerX,
  };
}

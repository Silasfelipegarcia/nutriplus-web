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
        <svg class="goal-chart__svg" viewBox="0 0 360 220" preserveAspectRatio="none" role="img" aria-label="Gráfico de previsão da meta de peso">
          @for (grid of horizontalGrids(); track grid) {
            <line x1="48" [attr.y1]="grid" x2="350" [attr.y2]="grid" class="goal-chart__grid" />
          }
          @for (label of yLabels(); track label.y) {
            <text x="4" [attr.y]="label.y + 3" class="goal-chart__y-label">{{ label.text }}</text>
          }
          @if (targetY() != null) {
            <line x1="48" [attr.y1]="targetY()" x2="350" [attr.y2]="targetY()" class="goal-chart__target" />
            <text x="352" [attr.y]="targetY()! + 4" class="goal-chart__target-label">Meta</text>
          }
          @if (targetMarkerX() != null) {
            <line [attr.x1]="targetMarkerX()" y1="20" [attr.x2]="targetMarkerX()" y2="196" class="goal-chart__deadline" />
            <text [attr.x]="targetMarkerX()! + 2" y="14" class="goal-chart__deadline-label">Prazo</text>
          }
          @for (marker of planMarkers(); track marker.x) {
            <line [attr.x1]="marker.x" y1="20" [attr.x2]="marker.x" y2="196" class="goal-chart__plan-marker" />
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
            <circle [attr.cx]="dot.x" [attr.cy]="dot.y" [attr.r]="dot.radius ?? 3.5" [attr.fill]="dot.color" />
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
          <span><i class="goal-chart__swatch" [style.background]="paceColor()"></i>Tendência</span>
        </div>
      </div>
    }
  `,
  styles: `
    .goal-chart { display: grid; gap: 0.5rem; }
    .goal-chart__empty { margin: 0; font-size: 0.85rem; color: var(--nutri-ink-muted); }
    .goal-chart__svg {
      width: 100%;
      height: 240px;
      background: linear-gradient(180deg, rgba(61, 139, 95, 0.04) 0%, transparent 100%);
      border-radius: var(--nutri-radius-sm);
    }
    .goal-chart__grid { stroke: var(--nutri-border); stroke-width: 1; }
    .goal-chart__y-label { font-size: 8px; fill: var(--nutri-ink-muted); }
    .goal-chart__target { stroke: rgba(61, 139, 95, 0.45); stroke-width: 1.5; stroke-dasharray: 6 4; }
    .goal-chart__target-label { font-size: 8px; fill: var(--nutri-ink-muted); }
    .goal-chart__deadline { stroke: rgba(107, 114, 128, 0.45); stroke-width: 1.5; stroke-dasharray: 5 5; }
    .goal-chart__deadline-label { font-size: 8px; fill: var(--nutri-ink-muted); }
    .goal-chart__plan-marker { stroke: rgba(230, 81, 0, 0.45); stroke-width: 1.5; stroke-dasharray: 4 4; }
    .goal-chart__x-labels {
      position: relative;
      height: 1.1rem;
      margin: 0 2.5rem 0 2.8rem;
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
  readonly yLabels = computed(() => this.plot().yLabels);
  readonly horizontalGrids = computed(() => this.plot().horizontalGrids);
  readonly targetY = computed(() => this.plot().targetY);
  readonly targetMarkerX = computed(() => this.plot().targetMarkerX);
  readonly planMarkers = computed(() => this.plot().planMarkers);
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
  const journeyStart = parseDate(timeline.journeyStartDate ?? timeline.currentPlanStartDate);
  const chartEnd = parseDate(timeline.chartEndDate ?? timeline.targetDate);

  if (!journeyStart || !chartEnd || chartEnd.getTime() <= journeyStart.getTime()) {
    return emptyPlot();
  }

  const minDay = dayIndex(journeyStart);
  const maxDay = dayIndex(chartEnd);
  const span = Math.max(maxDay - minDay, 1);

  const left = 48;
  const right = 350;
  const top = 20;
  const bottom = 196;
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

  if (yValues.length === 0) {
    return emptyPlot();
  }

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
  let current = toPoints((timeline.weightHistory ?? []).filter((p) => p.currentPlanPeriod));
  if (current.length === 1 && timeline.startWeightKg != null && journeyStart) {
    const anchor = { x: xFor(journeyStart), y: yFor(timeline.startWeightKg) };
    if (current[0].x > anchor.x) {
      current = [anchor, ...current];
    }
  }
  const pace = toPoints(timeline.requiredPaceLine ?? []);
  const projection = toPoints(timeline.projectionLine ?? []);

  const lines: PlotLine[] = [];
  if (prior.length >= 2) lines.push({ points: prior, color: '#9ca3af', strokeWidth: 2 });
  if (current.length >= 1) lines.push({ points: current, color: 'var(--nutri-brand)', strokeWidth: 3 });
  if (pace.length >= 2) lines.push({ points: pace, color: '#6b7280', dashed: true });
  if (projection.length >= 2) {
    lines.push({
      points: projection,
      color: goalTimelinePaceColor(timeline.paceStatus),
      dashed: true,
      strokeWidth: 2.5,
    });
  }

  const dots: { x: number; y: number; color: string; radius?: number }[] = [];
  for (const point of current) {
    dots.push({ x: point.x, y: point.y, color: 'var(--nutri-brand)' });
  }
  if (projection.length > 0) {
    const last = projection[projection.length - 1];
    dots.push({ x: last.x, y: last.y, color: goalTimelinePaceColor(timeline.paceStatus), radius: 4 });
  }

  const xLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const day = minDay + Math.round(span * ratio);
    const d = new Date(day * 86400000);
    const text = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const x = left + ratio * width;
    return { x, pct: (x / 360) * 100, text };
  });

  const yLabels = [0, 0.5, 1].map((ratio) => {
    const value = chartMax - ratio * ySpan;
    return { y: yFor(value), text: `${value.toFixed(1)} kg` };
  });

  const horizontalGrids = [0.25, 0.5, 0.75].map((r) => top + r * height);
  const targetY = timeline.targetWeightKg != null ? yFor(timeline.targetWeightKg) : null;
  const targetDate = parseDate(timeline.targetDate);
  const targetMarkerX = targetDate ? xFor(targetDate) : null;

  const planMarkers = (timeline.planEras ?? [])
    .filter((e) => !e.current)
    .map((e) => parseDate(e.startDate))
    .filter((d): d is Date => d != null)
    .map((d) => ({ x: xFor(d) }));

  return {
    layout: { minDay, maxDay },
    lines,
    dots,
    xLabels,
    yLabels,
    horizontalGrids,
    targetY,
    targetMarkerX,
    planMarkers,
  };
}

function emptyPlot() {
  return {
    layout: null as null,
    lines: [] as PlotLine[],
    dots: [] as { x: number; y: number; color: string; radius?: number }[],
    xLabels: [] as { x: number; pct: number; text: string }[],
    yLabels: [] as { y: number; text: string }[],
    horizontalGrids: [] as number[],
    targetY: null as number | null,
    targetMarkerX: null as number | null,
    planMarkers: [] as { x: number }[],
  };
}

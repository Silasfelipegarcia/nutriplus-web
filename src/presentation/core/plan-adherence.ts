export const PLAN_DAY_STATUS_LABELS: Record<string, string> = {
  ON_TRACK: 'Em linha',
  PARTIAL: 'Parcial',
  OVER: 'Acima da meta',
  NO_DATA: 'Sem registro',
};

export const PLAN_DAY_STATUS_COLORS: Record<string, string> = {
  ON_TRACK: 'var(--nutri-brand)',
  PARTIAL: '#d4a017',
  OVER: '#e07b39',
  NO_DATA: '#d0d0d0',
};

export const planAdherenceEstimateDisclaimer =
  'Projeção baseada nos seus registros recentes. Estimativa de apoio — não substitui orientação profissional.';

export function formatAdherenceDayLabel(isoDate: string): string {
  const parsed = new Date(isoDate + 'T12:00:00');
  if (Number.isNaN(parsed.getTime())) return isoDate;
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return `${weekdays[parsed.getDay()]} ${parsed.getDate()}/${parsed.getMonth() + 1}`;
}

export function planAdherenceShowDateLabel(index: number, total: number): boolean {
  if (total <= 1) return index === 0;
  if (index === 0 || index === total - 1) return true;
  if (total <= 7) return true;
  if (total <= 14) return index % 2 === 0;
  const step = Math.max(1, Math.ceil((total - 1) / 5));
  return index % step === 0;
}

export function planAdherenceShortDateLabel(isoDate: string, index: number, total: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  if (total > 14 && index !== 0 && index !== total - 1) {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
  return `${day}/${month}`;
}

export function planAdherencePeriodLabel(isoStart: string, isoEnd: string): string {
  const start = new Date(isoStart + 'T12:00:00');
  const end = new Date(isoEnd + 'T12:00:00');
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

/** True quando há pelo menos um check-in ou extra registrado no período. */
export function planAdherenceHasStarted(
  daily: ReadonlyArray<{
    mealsCompleted: number;
    mealsSkipped: number;
    extras?: ReadonlyArray<unknown>;
  }>,
): boolean {
  return daily.some(
    (d) => d.mealsCompleted > 0 || d.mealsSkipped > 0 || (d.extras?.length ?? 0) > 0,
  );
}

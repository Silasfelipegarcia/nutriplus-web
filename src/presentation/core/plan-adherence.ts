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

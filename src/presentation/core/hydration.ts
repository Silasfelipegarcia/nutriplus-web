export function formatWaterTargetMl(ml?: number | null): string {
  if (ml == null || ml <= 0) return '';
  const liters = ml / 1000;
  if (Math.abs(liters - Math.round(liters)) < 0.05) {
    return `${Math.round(liters)} L/dia`;
  }
  return `${liters.toFixed(1).replace('.', ',')} L/dia`;
}

export function formatWaterTargetShort(ml?: number | null): string {
  if (ml == null || ml <= 0) return '';
  const liters = ml / 1000;
  if (Math.abs(liters - Math.round(liters)) < 0.05) {
    return `~${Math.round(liters)} L`;
  }
  return `~${liters.toFixed(1).replace('.', ',')} L`;
}

export const waterTargetDisclaimer =
  'Meta estimada (~35 ml/kg). Condições de saúde podem exigir outro volume — siga orientação do seu nutricionista ou médico.';

export const waterTargetRenalMessage =
  'Meta hídrica personalizada: consulte seu profissional.';

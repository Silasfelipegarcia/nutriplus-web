export function isPlanTargetOutOfSync(
  planCalories: number | null | undefined,
  targetCalories: number | null | undefined,
  tolerance = 50,
): boolean {
  if (planCalories == null || targetCalories == null) return false;
  return Math.abs(planCalories - targetCalories) > tolerance;
}

export function planTargetMismatchMessage(
  targetCalories: number,
  trainingDailyExtraKcal?: number | null,
): string {
  const target = Math.round(targetCalories);
  if (trainingDailyExtraKcal != null && trainingDailyExtraKcal > 0) {
    const extra = Math.round(trainingDailyExtraKcal);
    return `Suas metas foram atualizadas para ${target} kcal/dia (+${extra} de treino). Gere um novo plano para refletir aqui.`;
  }
  return `Suas metas foram atualizadas para ${target} kcal/dia. Gere um novo plano para refletir aqui.`;
}

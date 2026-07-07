import { PlanRegenerationEligibility } from '../../domain/entities';

export const PlanRegenerationReasons = {
  firstPlan: 'FIRST_PLAN',
  athleteSwitch: 'ATHLETE_SWITCH',
  oneTimeCorrection: 'ONE_TIME_CORRECTION',
  cycleReview: 'CYCLE_REVIEW',
  generationRetry: 'GENERATION_RETRY',
  unlockedRegen: 'UNLOCKED_REGEN',
  planReset: 'PLAN_RESET',
} as const;

export type PlanRegenerationReason =
  (typeof PlanRegenerationReasons)[keyof typeof PlanRegenerationReasons];

export interface ResolvePlanRegenerationOptions {
  explicitReason?: string;
  retryGenerationOnly?: boolean;
}

export function resolvePlanRegenerationReason(
  eligibility: PlanRegenerationEligibility,
  options: ResolvePlanRegenerationOptions = {},
): string | null {
  const { explicitReason, retryGenerationOnly = false } = options;

  if (explicitReason && eligibility.allowedReasons.includes(explicitReason)) {
    return explicitReason;
  }
  if (retryGenerationOnly && eligibility.allowedReasons.includes(PlanRegenerationReasons.generationRetry)) {
    return PlanRegenerationReasons.generationRetry;
  }
  if (!eligibility.hasMealPlan && eligibility.allowedReasons.includes(PlanRegenerationReasons.firstPlan)) {
    return PlanRegenerationReasons.firstPlan;
  }
  if (eligibility.allowedReasons.includes(PlanRegenerationReasons.cycleReview)) {
    return PlanRegenerationReasons.cycleReview;
  }
  if (eligibility.allowedReasons.includes(PlanRegenerationReasons.athleteSwitch)) {
    return PlanRegenerationReasons.athleteSwitch;
  }
  if (eligibility.allowedReasons.includes(PlanRegenerationReasons.oneTimeCorrection)) {
    return PlanRegenerationReasons.oneTimeCorrection;
  }
  if (eligibility.allowedReasons.includes(PlanRegenerationReasons.unlockedRegen)) {
    return PlanRegenerationReasons.unlockedRegen;
  }
  if (eligibility.allowedReasons.includes(PlanRegenerationReasons.generationRetry)) {
    return PlanRegenerationReasons.generationRetry;
  }
  if (eligibility.allowedReasons.includes(PlanRegenerationReasons.planReset)) {
    return PlanRegenerationReasons.planReset;
  }
  return null;
}

export const PLAN_RESET_CONFIRM_PHRASE = 'ZERAR PLANO';

export function planResetIntroMessage(): string {
  return 'Use esta opção para descartar o plano atual e gerar outro do zero. '
    + 'Planos anteriores permanecem no histórico da Evolução.';
}

export function planResetConsequences(eligibility: PlanRegenerationEligibility): string[] {
  const lines = [
    'O plano alimentar atual será substituído por um novo.',
    'Planos anteriores continuam no histórico da Evolução.',
    'Você perde todos os registros deste plano: check-ins, extras, medidas e reavaliações desde que ele começou.',
    'O acompanhamento de 15 dias reinicia a partir do novo plano.',
  ];
  if (eligibility.currentPlanStarted) {
    lines.push('Sua sequência e aderência deste plano serão apagadas.');
    lines.push('Esta ação não devolve a correção única — é um reinício completo.');
  }
  return lines;
}

export function canResetPlan(eligibility: PlanRegenerationEligibility | null | undefined): boolean {
  return eligibility?.planResetAvailable === true
    && eligibility.allowedReasons.includes(PlanRegenerationReasons.planReset);
}

export function planRegenLockedMessage(eligibility: PlanRegenerationEligibility): string {
  if (eligibility.aiPlanIneligibleMessagePt?.trim()) {
    return eligibility.aiPlanIneligibleMessagePt;
  }
  if (eligibility.reviewDue) {
    return 'Sua reavaliação de 15 dias está disponível na aba Evolução.';
  }
  if (eligibility.daysUntilUnlock > 0) {
    return `Seu plano segue por mais ${eligibility.daysUntilUnlock} dias. Depois disso, a reavaliação na aba Evolução libera nova análise.`;
  }
  if (!eligibility.oneTimeCorrectionAvailable && eligibility.hasMealPlan) {
    return 'Você já usou sua correção única. Aguarde a próxima reavaliação na aba Evolução.';
  }
  return 'Nova geração não disponível agora. Confira a aba Evolução.';
}

export function isAiPlanEligible(eligibility: PlanRegenerationEligibility): boolean {
  return eligibility.aiPlanEligible !== false;
}

export function isUnlimitedPlanRegen(eligibility: PlanRegenerationEligibility): boolean {
  return eligibility.unlimitedRegenEnabled === true
    || eligibility.allowedReasons.includes(PlanRegenerationReasons.unlockedRegen);
}

import {
  isAthletePlan,
  isPaidPlan,
  PlanCatalogItem,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '../../domain/entities/payment.model';

const STATUS_ATIVO = new Set(['ACTIVE', 'TRIAL', 'CANCELLED_PENDING']);

export function temAssinaturaAtiva(sub: SubscriptionStatus | null | undefined): boolean {
  if (!sub?.plan || !isPaidPlan(sub.plan)) return false;
  return STATUS_ATIVO.has((sub.status ?? '').toUpperCase());
}

export function isPlanoAtualSub(
  plan: SubscriptionPlanCode | undefined,
  sub: SubscriptionStatus | null | undefined,
): boolean {
  if (!plan || plan === 'FREE' || !sub) return plan === 'FREE';
  return sub.plan === plan && STATUS_ATIVO.has((sub.status ?? '').toUpperCase());
}

/** Planos que o usuário pode contratar ou fazer upgrade (não inclui o plano atual). */
export function podeAssinarPlano(
  item: PlanCatalogItem,
  sub: SubscriptionStatus | null | undefined,
  billingEnabled: boolean,
): boolean {
  if (!billingEnabled) return false;
  if (item.contatoComercial || !isPaidPlan(item.plan)) return false;

  const current = sub?.plan;
  if (current === 'ATHLETE_YEARLY' && item.plan !== 'ATHLETE_YEARLY') return false;
  if (current === 'ESSENTIAL_YEARLY' && isAthletePlan(item.plan) && item.plan === 'ATHLETE_MONTHLY') {
    return true;
  }
  if (item.plan === 'ESSENTIAL_MONTHLY' && current === 'ESSENTIAL_YEARLY') return false;
  if (item.plan === 'ATHLETE_MONTHLY' && current === 'ATHLETE_YEARLY') return false;

  return !isPlanoAtualSub(item.plan, sub);
}

export function planosDisponiveis(
  catalogo: PlanCatalogItem[],
  sub: SubscriptionStatus | null | undefined,
  billingEnabled: boolean,
): PlanCatalogItem[] {
  return catalogo.filter((item) => podeAssinarPlano(item, sub, billingEnabled));
}

/** Quem já tem assinatura pode mudar de plano mesmo com billing desligado no catálogo público. */
export function cobrancaEfetivaParaMudanca(
  sub: SubscriptionStatus | null | undefined,
  billingEnabled: boolean,
): boolean {
  return billingEnabled || temAssinaturaAtiva(sub);
}

export function planosParaMudanca(
  catalogo: PlanCatalogItem[],
  sub: SubscriptionStatus | null | undefined,
  billingEnabled: boolean,
): PlanCatalogItem[] {
  return planosDisponiveis(catalogo, sub, cobrancaEfetivaParaMudanca(sub, billingEnabled));
}

/** Sugestão curta de upgrade (ex.: mensal → anual). */
export function sugestaoUpgrade(
  catalogo: PlanCatalogItem[],
  sub: SubscriptionStatus | null | undefined,
  billingEnabled: boolean,
): PlanCatalogItem | null {
  const opcoes = planosParaMudanca(catalogo, sub, billingEnabled);
  if (opcoes.length === 0) return null;

  const current = sub?.plan;
  if (current === 'ESSENTIAL_MONTHLY') {
    return opcoes.find((p) => p.plan === 'ESSENTIAL_YEARLY') ?? opcoes[0];
  }
  if (current === 'ATHLETE_MONTHLY') {
    return opcoes.find((p) => p.plan === 'ATHLETE_YEARLY') ?? opcoes[0];
  }
  if (current === 'ESSENTIAL_YEARLY') {
    return opcoes.find((p) => isAthletePlan(p.plan)) ?? opcoes[0];
  }
  return opcoes[0];
}

export function estaEmTrial(sub: SubscriptionStatus | null | undefined): boolean {
  if (!sub) return false;
  const status = (sub.status ?? '').toUpperCase();
  if (status === 'CANCELLED_PENDING' || sub.podeReativar) return false;
  if (sub.emTrial) return true;
  return status === 'TRIAL';
}

/** Trial em andamento com renovação automática ainda ativa (antes de cancelar). */
export function estaEmTrialAtivo(sub: SubscriptionStatus | null | undefined): boolean {
  return estaEmTrial(sub);
}

/** Botão de trial só para quem ainda não assinou e nunca usou o período de teste. */
export function podeIniciarTrial(sub: SubscriptionStatus | null | undefined): boolean {
  if (!sub?.trialDisponivel) return false;
  if (estaEmTrial(sub)) return false;
  if (temAssinaturaAtiva(sub)) return false;
  return true;
}

export function rotuloValidadeAssinatura(sub: SubscriptionStatus): string {
  if (estaEmTrial(sub)) return 'Trial termina em';
  const status = (sub.status ?? '').toUpperCase();
  if (status === 'CANCELLED_PENDING' || sub.podeReativar) return 'Acesso até';
  return 'Próxima renovação';
}

export function rotuloDiasRestantes(sub: SubscriptionStatus): string {
  if (estaEmTrial(sub)) return 'Dias restantes do trial';
  const status = (sub.status ?? '').toUpperCase();
  if (status === 'CANCELLED_PENDING') return 'Dias de acesso';
  return 'Dias restantes';
}

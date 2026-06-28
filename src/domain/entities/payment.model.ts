export type AthletePlan = 'FREE' | 'ATHLETE_MONTHLY' | 'ATHLETE_YEARLY';

export interface PaymentConfig {
  publicKey: string;
  configured: boolean;
  billingEnabled: boolean;
}

export interface PlanCatalogResponse {
  billingEnabled: boolean;
  plans: PlanCatalogItem[];
}

export interface PlanCatalogItem {
  plan: AthletePlan;
  nome: string;
  descricao: string;
  priceCents: number;
  priceLabel: string;
  beneficios: string[];
  contatoComercial: boolean;
  trialDisponivel: boolean;
}

export interface CheckoutResponse {
  orderId: string;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  amountCents: number;
  amountLabel: string;
  upgrade: boolean;
}

export const CHECKOUT_ORDER_STORAGE_KEY = 'nutriplus_checkout_order';

export interface CheckoutSyncRequest {
  paymentId?: string;
  externalReference?: string;
  preferenceId?: string;
  orderId?: string;
}

export interface CheckoutSyncResponse {
  status: string;
  statusLabel: string;
  planNome: string;
  orderId: string;
}

export interface ChargePlanRequest {
  plan: 'ATHLETE_MONTHLY' | 'ATHLETE_YEARLY';
  cardId?: string;
  securityCode?: string;
  token?: string;
}

export interface ChargePlanResponse {
  orderId: string;
  status: string;
  statusLabel: string;
  planNome: string;
}

export interface SavedCard {
  id: string;
  brand: string;
  lastFourDigits: string;
  expirationMonth: string;
  expirationYear: string;
  holderName: string;
  defaultCard?: boolean;
}

export interface PaymentHistoryItem {
  id: string;
  planNome: string;
  amountLabel: string;
  status: string;
  statusLabel: string;
  createdAt: string;
}

export interface SubscriptionStatus {
  status: string;
  plan?: AthletePlan;
  planNome?: string;
  validUntil?: string;
  cancelledAt?: string;
  autoRenew: boolean;
  daysRemaining: number;
  defaultCardId?: string;
  podeCancelar: boolean;
  podeReativar: boolean;
  trialDisponivel: boolean;
  emTrial: boolean;
  billingEnforced?: boolean;
}

export interface PlanQuote {
  plan: 'ATHLETE_MONTHLY' | 'ATHLETE_YEARLY';
  amountCents: number;
  amountLabel: string;
  fullPriceCents: number;
  fullPriceLabel: string;
  upgrade: boolean;
  description?: string;
}

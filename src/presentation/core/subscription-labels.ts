/** Rótulos de assinatura em português para exibição ao usuário. */
export function subscriptionStatusLabel(status: string | undefined | null): string {
  const normalized = status?.toUpperCase() ?? '';
  switch (normalized) {
    case 'ACTIVE':
      return 'Ativo';
    case 'TRIAL':
      return 'Período de teste';
    case 'CANCELLED_PENDING':
      return 'Cancelamento agendado';
    case 'EXPIRED':
      return 'Expirado';
    case 'NONE':
    case 'FREE':
      return 'Gratuito';
    default:
      return status ?? '—';
  }
}

export function paymentStatusLabel(status: string | undefined | null, fallback?: string): string {
  if (fallback?.trim()) return fallback;
  const normalized = status?.toUpperCase() ?? '';
  switch (normalized) {
    case 'APPROVED':
      return 'Aprovado';
    case 'PENDING':
      return 'Pendente';
    case 'REJECTED':
    case 'CANCELLED':
      return 'Recusado';
    default:
      return status ?? '—';
  }
}

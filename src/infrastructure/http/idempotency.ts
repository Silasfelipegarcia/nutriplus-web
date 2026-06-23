/** UUID por gesto do usuário — retry reutiliza a mesma key (API homolog/prod). */
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function withIdempotencyKey(
  headers: Record<string, string>,
  idempotencyKey: string,
): Record<string, string> {
  return { ...headers, [IDEMPOTENCY_HEADER]: idempotencyKey };
}

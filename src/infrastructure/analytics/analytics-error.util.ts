/** Normaliza mensagens de erro para parâmetros GA4 (snake_case, max 40 chars). */
export function sanitizeAnalyticsError(message: string): string {
  return message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

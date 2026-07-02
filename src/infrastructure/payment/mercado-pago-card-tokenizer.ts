export interface MercadoPagoCardTokenInput {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

const MP_CARD_TOKENS_URL = 'https://api.mercadopago.com/v1/card_tokens';

export async function createMercadoPagoCardToken(
  publicKey: string,
  input: MercadoPagoCardTokenInput,
): Promise<string> {
  const url = `${MP_CARD_TOKENS_URL}?public_key=${encodeURIComponent(publicKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card_number: input.cardNumber.replace(/\D/g, ''),
      expiration_month: Number.parseInt(input.expirationMonth, 10),
      expiration_year: Number.parseInt(input.expirationYear, 10),
      security_code: input.securityCode,
      cardholder: {
        name: input.cardholderName.trim(),
        identification: {
          type: input.identificationType,
          number: input.identificationNumber.replace(/\D/g, ''),
        },
      },
    }),
  });

  const data = (await response.json()) as {
    id?: string;
    message?: string;
    cause?: Array<{ description?: string; code?: string }>;
  };

  if (!response.ok) {
    const detail = data.cause?.[0]?.description ?? data.message;
    throw new Error(detail || 'Não foi possível validar o cartão no Mercado Pago.');
  }

  if (!data.id) {
    throw new Error('Resposta inválida do Mercado Pago.');
  }

  return data.id;
}

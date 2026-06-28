export interface MercadoPagoCardTokenParams {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

export interface MercadoPagoInstance {
  createCardToken(params: MercadoPagoCardTokenParams): Promise<{ id?: string }>;
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { newIdempotencyKey, withIdempotencyKey } from './idempotency';
import {
  ChargePlanRequest,
  ChargePlanResponse,
  CheckoutResponse,
  CheckoutSyncRequest,
  CheckoutSyncResponse,
  PaymentConfig,
  PaymentHistoryItem,
  PlanCatalogItem,
  PlanCatalogResponse,
  PlanQuote,
  SavedCard,
  SubscriptionStatus,
} from '../../domain/entities/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  listarCatalogo(): Observable<PlanCatalogResponse> {
    return this.http.get<PlanCatalogResponse>(`${this.apiBase}/plans`).pipe(catchError(this.tratarErro));
  }

  obterConfig(): Observable<PaymentConfig> {
    return this.http.get<PaymentConfig>(`${this.apiBase}/payments/config`).pipe(catchError(this.tratarErro));
  }

  criarCheckout(plan: 'ATHLETE_MONTHLY' | 'ATHLETE_YEARLY'): Observable<CheckoutResponse> {
    const headers = withIdempotencyKey({}, newIdempotencyKey());
    return this.http.post<CheckoutResponse>(`${this.apiBase}/payments/checkout`, { plan }, { headers }).pipe(
      catchError(this.tratarErro),
    );
  }

  sincronizarCheckout(body: CheckoutSyncRequest): Observable<CheckoutSyncResponse> {
    return this.http.post<CheckoutSyncResponse>(`${this.apiBase}/payments/checkout/sync`, body).pipe(
      catchError(this.tratarErro),
    );
  }

  cobrarPlano(body: ChargePlanRequest): Observable<ChargePlanResponse> {
    const headers = withIdempotencyKey({}, newIdempotencyKey());
    return this.http.post<ChargePlanResponse>(`${this.apiBase}/payments/charge`, body, { headers }).pipe(
      catchError(this.tratarErro),
    );
  }

  obterCotacao(plan: 'ATHLETE_MONTHLY' | 'ATHLETE_YEARLY'): Observable<PlanQuote> {
    return this.http.get<PlanQuote>(`${this.apiBase}/payments/quote`, { params: { plan } }).pipe(
      catchError(this.tratarErro),
    );
  }

  listarCartoes(): Observable<SavedCard[]> {
    return this.http.get<SavedCard[]>(`${this.apiBase}/payments/cards`).pipe(catchError(this.tratarErro));
  }

  salvarCartao(token: string): Observable<SavedCard> {
    const headers = withIdempotencyKey({}, newIdempotencyKey());
    return this.http.post<SavedCard>(`${this.apiBase}/payments/cards`, { token }, { headers }).pipe(
      catchError(this.tratarErro),
    );
  }

  removerCartao(cardId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/payments/cards/${cardId}`).pipe(catchError(this.tratarErro));
  }

  listarHistorico(): Observable<PaymentHistoryItem[]> {
    return this.http.get<PaymentHistoryItem[]>(`${this.apiBase}/payments/history`).pipe(catchError(this.tratarErro));
  }

  obterAssinatura(): Observable<SubscriptionStatus> {
    return this.http.get<SubscriptionStatus>(`${this.apiBase}/payments/subscription`).pipe(catchError(this.tratarErro));
  }

  cancelarAssinatura(): Observable<SubscriptionStatus> {
    const headers = withIdempotencyKey({}, newIdempotencyKey());
    return this.http.post<SubscriptionStatus>(`${this.apiBase}/payments/subscription/cancel`, {}, { headers }).pipe(
      catchError(this.tratarErro),
    );
  }

  reativarAssinatura(): Observable<SubscriptionStatus> {
    const headers = withIdempotencyKey({}, newIdempotencyKey());
    return this.http.post<SubscriptionStatus>(`${this.apiBase}/payments/subscription/reactivate`, {}, { headers }).pipe(
      catchError(this.tratarErro),
    );
  }

  iniciarTrial(): Observable<SubscriptionStatus> {
    const headers = withIdempotencyKey({}, newIdempotencyKey());
    return this.http.post<SubscriptionStatus>(`${this.apiBase}/payments/trial`, {}, { headers }).pipe(
      catchError(this.tratarErro),
    );
  }

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    const mensagem = error.error?.message || error.message || 'Erro ao processar pagamento';
    return throwError(() => mensagem);
  }
}

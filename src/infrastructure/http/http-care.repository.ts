import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TraceService } from '../tracing/trace.service';
import { ApiError } from './api-error';
import { newIdempotencyKey, withIdempotencyKey } from './idempotency';
import {
  CareRating,
  CareRelationship,
  Conversation,
  NutritionistPublic,
  NutritionistRatingsSummary,
  PaymentIntentResult,
} from '../../domain/entities';
import { CareRepository } from '../../domain/repositories/pro.repository';

@Injectable()
export class HttpCareRepository implements CareRepository {
  private readonly http = inject(HttpClient);
  private readonly trace = inject(TraceService);

  listNutritionists(state?: string, city?: string): Promise<NutritionistPublic[]> {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (city) params.set('city', city);
    const query = params.toString();
    return this.get(`/nutritionists${query ? `?${query}` : ''}`, 'marketplace-list');
  }

  getNutritionist(id: number): Promise<NutritionistPublic> {
    return this.get(`/nutritionists/${id}`, 'marketplace-detail');
  }

  getNutritionistRatings(id: number): Promise<NutritionistRatingsSummary> {
    return this.get(`/nutritionists/${id}/ratings`, 'marketplace-ratings');
  }

  getMyCare(): Promise<CareRelationship[]> {
    return this.get('/care/my', 'care-my');
  }

  acceptInvite(code: string, consentVersion: string): Promise<CareRelationship> {
    return this.post(
      `/care/accept-invite/${encodeURIComponent(code)}`,
      { consentDataSharing: true, consentVersion },
      'accept-invite',
    );
  }

  requestCare(nutritionistId: number, preferredCareMode?: string): Promise<CareRelationship> {
    return this.post(
      `/care/request/${nutritionistId}`,
      {
        consentDataSharing: true,
        ...(preferredCareMode ? { preferredCareMode } : {}),
      },
      'care-request',
    );
  }

  payConsultation(nutritionistId: number): Promise<PaymentIntentResult> {
    return this.post('/consultations/pay', { nutritionistId }, 'consultation-pay');
  }

  rateCare(careRelationshipId: number, stars: number, comment?: string): Promise<CareRating> {
    return this.post(
      `/care/relationships/${careRelationshipId}/rate`,
      { stars, ...(comment ? { comment } : {}) },
      'care-rate',
    );
  }

  listConversations(): Promise<Conversation[]> {
    return this.get('/conversations', 'patient-conversations');
  }

  getConversation(threadId: number): Promise<Conversation> {
    return this.get(`/conversations/${threadId}`, 'patient-conversation');
  }

  async sendMessage(threadId: number, body: string): Promise<void> {
    await this.post(`/conversations/${threadId}/messages`, { body }, 'patient-message');
  }

  private async get<T>(path: string, flowId: string): Promise<T> {
    return this.authorized<T>('GET', path, flowId);
  }

  private async post<T>(path: string, body: unknown, flowId: string): Promise<T> {
    return this.authorized<T>('POST', path, flowId, body);
  }

  private async authorized<T>(method: 'GET' | 'POST', path: string, flowId: string, body?: unknown): Promise<T> {
    const url = `${environment.apiBaseUrl}${path}`;
    const idempotencyKey = method === 'GET' ? undefined : newIdempotencyKey();
    const headers = this.authHeaders(flowId, idempotencyKey);
    return this.request<T>(method, url, headers, body);
  }

  private authHeaders(flowId: string, idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.trace.headers(flowId),
    };
    return idempotencyKey ? withIdempotencyKey(headers, idempotencyKey) : headers;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    url: string,
    headers: Record<string, string>,
    body?: unknown,
  ): Promise<T> {
    try {
      if (method === 'GET') {
        return await firstValueFrom(this.http.get<T>(url, { headers }));
      }
      return await firstValueFrom(this.http.post<T>(url, body, { headers }));
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const errBody = error.error as { message?: string; correlationId?: string } | null;
        throw new ApiError(errBody?.message ?? 'Erro na requisição', error.status, errBody?.correlationId);
      }
      throw error;
    }
  }
}

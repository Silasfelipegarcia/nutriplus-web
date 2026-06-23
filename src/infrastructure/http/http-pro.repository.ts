import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TraceService } from '../tracing/trace.service';
import { TokenStorage } from '../auth/token-storage';
import { ApiError } from './api-error';
import { newIdempotencyKey, withIdempotencyKey } from './idempotency';
import { HttpAuthRepository } from './http-auth.repository';
import {
  CareRelationship,
  Conversation,
  MealPlan,
  PatientDossier,
  ProDashboard,
  ProInvite,
} from '../../domain/entities';
import { ProRepository } from '../../domain/repositories/pro.repository';

@Injectable()
export class HttpProRepository implements ProRepository {
  private readonly http = inject(HttpClient);
  private readonly trace = inject(TraceService);
  private readonly tokens = inject(TokenStorage);
  private readonly authRepo = inject(HttpAuthRepository);

  getDashboard(): Promise<ProDashboard> {
    return this.get('/pro/dashboard', 'pro-dashboard');
  }

  listPatients(): Promise<CareRelationship[]> {
    return this.get('/pro/patients', 'pro-patients');
  }

  getDossier(patientId: number): Promise<PatientDossier> {
    return this.get(`/pro/patients/${patientId}/dossier`, 'pro-dossier');
  }

  listPatientMealPlans(patientId: number): Promise<MealPlan[]> {
    return this.get(`/pro/patients/${patientId}/meal-plans`, 'pro-meal-plans');
  }

  publishMealPlan(patientId: number, mealPlanId: number, notes?: string): Promise<MealPlan> {
    return this.put(
      `/pro/patients/${patientId}/meal-plans/${mealPlanId}/publish`,
      { reviewNotes: notes ?? '' },
      'pro-publish-plan',
    );
  }

  createInvite(maxUses = 10, expiresInDays = 30): Promise<ProInvite> {
    return this.post('/pro/invites', { maxUses, expiresInDays }, 'pro-invite');
  }

  listConversations(): Promise<Conversation[]> {
    return this.get('/conversations', 'pro-conversations');
  }

  getConversation(threadId: number): Promise<Conversation> {
    return this.get(`/conversations/${threadId}`, 'pro-conversation');
  }

  async sendMessage(threadId: number, body: string): Promise<void> {
    await this.post(`/conversations/${threadId}/messages`, { body }, 'pro-message');
  }

  private async get<T>(path: string, flowId: string): Promise<T> {
    return this.authorized<T>('GET', path, flowId);
  }

  private async post<T>(path: string, body: unknown, flowId: string): Promise<T> {
    return this.authorized<T>('POST', path, flowId, body);
  }

  private async put<T>(path: string, body: unknown, flowId: string): Promise<T> {
    return this.authorized<T>('PUT', path, flowId, body);
  }

  private async authorized<T>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    flowId: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${environment.apiBaseUrl}${path}`;
    const idempotencyKey = method === 'GET' ? undefined : newIdempotencyKey();
    const headers = this.authHeaders(flowId, idempotencyKey);
    try {
      return await this.request<T>(method, url, headers, body);
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 401) {
        const refresh = this.tokens.getRefreshToken();
        if (refresh) {
          await this.authRepo.refreshToken(refresh);
          return this.request<T>(method, url, this.authHeaders(flowId, idempotencyKey), body);
        }
      }
      throw e;
    }
  }

  private authHeaders(flowId: string, idempotencyKey?: string): Record<string, string> {
    const token = this.tokens.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...this.trace.headers(flowId),
    };
    return idempotencyKey ? withIdempotencyKey(headers, idempotencyKey) : headers;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT',
    url: string,
    headers: Record<string, string>,
    body?: unknown,
  ): Promise<T> {
    try {
      switch (method) {
        case 'GET':
          return await firstValueFrom(this.http.get<T>(url, { headers }));
        case 'POST':
          return await firstValueFrom(this.http.post<T>(url, body, { headers }));
        case 'PUT':
          return await firstValueFrom(this.http.put<T>(url, body, { headers }));
      }
    } catch (error) {
      throw this.toApiError(error);
    }
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string; correlationId?: string } | null;
      return new ApiError(body?.message ?? 'Erro na requisição', error.status, body?.correlationId);
    }
    if (error instanceof ApiError) return error;
    return new ApiError('Erro na requisição');
  }
}

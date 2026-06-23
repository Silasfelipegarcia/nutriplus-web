import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TraceService } from '../tracing/trace.service';
import { TokenStorage } from '../auth/token-storage';
import { ApiError } from './api-error';
import { HttpAuthRepository } from './http-auth.repository';
import { CareRelationship, NutritionistPublic } from '../../domain/entities';
import { CareRepository } from '../../domain/repositories/pro.repository';

@Injectable()
export class HttpCareRepository implements CareRepository {
  private readonly http = inject(HttpClient);
  private readonly trace = inject(TraceService);
  private readonly tokens = inject(TokenStorage);
  private readonly authRepo = inject(HttpAuthRepository);

  listNutritionists(): Promise<NutritionistPublic[]> {
    return this.get('/nutritionists', 'marketplace-list');
  }

  acceptInvite(code: string, consentVersion: string): Promise<CareRelationship> {
    return this.post(
      `/care/accept-invite/${encodeURIComponent(code)}`,
      { consentDataSharing: true, consentVersion },
      'accept-invite',
    );
  }

  requestCare(nutritionistId: number): Promise<CareRelationship> {
    return this.post(`/care/request/${nutritionistId}`, {}, 'care-request');
  }

  private async get<T>(path: string, flowId: string): Promise<T> {
    return this.authorized<T>('GET', path, flowId);
  }

  private async post<T>(path: string, body: unknown, flowId: string): Promise<T> {
    return this.authorized<T>('POST', path, flowId, body);
  }

  private async authorized<T>(method: 'GET' | 'POST', path: string, flowId: string, body?: unknown): Promise<T> {
    const url = `${environment.apiBaseUrl}${path}`;
    const headers = this.authHeaders(flowId);
    try {
      return await this.request<T>(method, url, headers, body);
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 401) {
        const refresh = this.tokens.getRefreshToken();
        if (refresh) {
          await this.authRepo.refreshToken(refresh);
          return this.request<T>(method, url, this.authHeaders(flowId), body);
        }
      }
      throw e;
    }
  }

  private authHeaders(flowId: string): Record<string, string> {
    const token = this.tokens.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...this.trace.headers(flowId),
    };
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

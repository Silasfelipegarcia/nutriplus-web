import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TraceService } from '../tracing/trace.service';
import { ApiError, isNotFound } from './api-error';
import { newIdempotencyKey, withIdempotencyKey } from './idempotency';
import {
  AcceptHouseholdInvitationResult,
  HouseholdInfo,
  HouseholdInvitationCreated,
  HouseholdShoppingList,
  PlanInvitationPreview,
} from '../../domain/entities/household.model';
import { HouseholdRepository } from '../../domain/repositories/household.repository';

@Injectable()
export class HttpHouseholdRepository implements HouseholdRepository {
  private readonly http = inject(HttpClient);
  private readonly trace = inject(TraceService);

  async getMyHousehold(): Promise<HouseholdInfo | null> {
    try {
      return await this.get<HouseholdInfo>('/households/me', 'household-me');
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  shareMealPlan(mealPlanId?: number): Promise<HouseholdInfo> {
    return this.post<HouseholdInfo>(
      '/households/share-plan',
      mealPlanId != null ? { mealPlanId } : {},
      'household-share',
    );
  }

  createInvitation(email: string, name?: string): Promise<HouseholdInvitationCreated> {
    return this.post<HouseholdInvitationCreated>(
      '/households/me/invitations',
      {
        email,
        ...(name?.trim() ? { name: name.trim() } : {}),
      },
      'household-invite',
    );
  }

  previewInvitation(token: string): Promise<PlanInvitationPreview> {
    const url = `${environment.apiBaseUrl}/public/plan-invitations/${encodeURIComponent(token)}`;
    return this.publicGet<PlanInvitationPreview>(url, 'household-invite-preview');
  }

  acceptInvitation(token: string): Promise<AcceptHouseholdInvitationResult> {
    return this.post<AcceptHouseholdInvitationResult>(
      `/households/plan-invitations/${encodeURIComponent(token)}/accept`,
      {},
      'household-invite-accept',
    );
  }

  getAggregatedShoppingList(): Promise<HouseholdShoppingList> {
    return this.get<HouseholdShoppingList>('/households/me/shopping-list', 'household-shopping');
  }

  private get<T>(path: string, flowId: string): Promise<T> {
    return this.authorized<T>('GET', path, flowId);
  }

  private post<T>(path: string, body: unknown, flowId: string): Promise<T> {
    return this.authorized<T>('POST', path, flowId, body);
  }

  private async authorized<T>(
    method: 'GET' | 'POST',
    path: string,
    flowId: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${environment.apiBaseUrl}${path}`;
    const idempotencyKey = method === 'GET' ? undefined : newIdempotencyKey();
    const headers = this.authHeaders(flowId, idempotencyKey);
    return this.request<T>(method, url, headers, body);
  }

  private async publicGet<T>(url: string, flowId: string): Promise<T> {
    const headers = {
      Accept: 'application/json',
      ...this.trace.headers(flowId),
    };
    return this.request<T>('GET', url, headers);
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
      throw this.toApiError(error);
    }
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      const message =
        typeof body === 'object' && body && 'message' in body
          ? String((body as { message: unknown }).message)
          : error.message || 'Erro na requisição';
      return new ApiError(message, error.status);
    }
    if (error instanceof ApiError) return error;
    return new ApiError(error instanceof Error ? error.message : 'Erro na requisição');
  }
}

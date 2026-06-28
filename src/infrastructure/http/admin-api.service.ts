import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenStorage } from '../auth/token-storage';
import { TraceService } from '../tracing/trace.service';
import { ApiError } from './api-error';
import { newIdempotencyKey, withIdempotencyKey } from './idempotency';

export interface AdminAccessSummary {
  pendingApprovalCount: number;
  loginEnabledCount: number;
  adminCount: number;
  pendingNutritionistCount: number;
  totalUsers: number;
}

export interface AdminUserAccess {
  id: number;
  name: string;
  email: string;
  role: string;
  loginEnabled: boolean;
  loginEnabledAt?: string;
  createdAt?: string;
  hasNutritionProfile: boolean;
  registrationSource: string;
  acquisitionCampaign?: string;
}

export interface FeatureFlag {
  code: string;
  name: string;
  description?: string;
  enabled: boolean;
  updatedAt?: string;
}

export interface AdminSubscriptionPlan {
  id: number;
  planCode: string;
  name: string;
  description?: string;
  priceCents: number;
  periodDays: number;
  priceSuffix?: string;
  benefits: string[];
  trialAvailable: boolean;
  contactSales: boolean;
  enabled: boolean;
  visibleInCatalog: boolean;
  sortOrder: number;
  updatedAt?: string;
}

export interface NutritionistPending {
  nutritionistId: number;
  name: string;
  email: string;
  crn: string;
  cpfMasked: string;
  marketplaceVisible: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorage);
  private readonly trace = inject(TraceService);

  summary(): Promise<AdminAccessSummary> {
    return this.get<AdminAccessSummary>('/admin/access/summary', 'admin-summary');
  }

  pendingUsers(): Promise<AdminUserAccess[]> {
    return this.get<AdminUserAccess[]>('/admin/access/pending', 'admin-pending');
  }

  approvedUsers(): Promise<AdminUserAccess[]> {
    return this.get<AdminUserAccess[]>('/admin/access/approved', 'admin-approved');
  }

  admins(): Promise<AdminUserAccess[]> {
    return this.get<AdminUserAccess[]>('/admin/access/admins', 'admin-admins');
  }

  setLoginEnabled(userId: number, enabled: boolean): Promise<AdminUserAccess> {
    return this.patch<AdminUserAccess>(`/admin/access/users/${userId}/login-enabled`, { enabled }, 'admin-login-toggle');
  }

  setUserAdmin(userId: number, admin: boolean): Promise<AdminUserAccess> {
    return this.patch<AdminUserAccess>(`/admin/access/users/${userId}/admin`, { admin }, 'admin-role-toggle');
  }

  pendingNutritionists(): Promise<NutritionistPending[]> {
    return this.get<NutritionistPending[]>('/admin/nutritionists/pending', 'admin-nutritionists-pending');
  }

  verifyNutritionist(nutritionistId: number): Promise<void> {
    return this.post<void>(`/admin/nutritionists/${nutritionistId}/verify`, 'admin-nutritionist-verify');
  }

  rejectNutritionist(nutritionistId: number): Promise<void> {
    return this.post<void>(`/admin/nutritionists/${nutritionistId}/reject`, 'admin-nutritionist-reject');
  }

  featureFlags(): Promise<FeatureFlag[]> {
    return this.get<FeatureFlag[]>('/admin/feature-flags', 'admin-flags');
  }

  updateFeatureFlag(code: string, enabled: boolean): Promise<FeatureFlag> {
    return this.patch<FeatureFlag>(`/admin/feature-flags/${code}`, { enabled }, 'admin-flag-toggle');
  }

  subscriptionPlans(): Promise<AdminSubscriptionPlan[]> {
    return this.get<AdminSubscriptionPlan[]>('/admin/subscription-plans', 'admin-plans');
  }

  updateSubscriptionPlan(id: number, body: Partial<AdminSubscriptionPlan> & {
    name: string;
    priceCents: number;
    periodDays: number;
    benefits: string[];
    trialAvailable: boolean;
    contactSales: boolean;
    enabled: boolean;
    visibleInCatalog: boolean;
    sortOrder: number;
  }): Promise<AdminSubscriptionPlan> {
    return this.patch<AdminSubscriptionPlan>(`/admin/subscription-plans/${id}`, body, 'admin-plan-update');
  }

  private async get<T>(path: string, flowId: string): Promise<T> {
    return this.request<T>('GET', path, flowId);
  }

  private async patch<T>(path: string, body: unknown, flowId: string): Promise<T> {
    return this.request<T>('PATCH', path, flowId, body);
  }

  private async post<T>(path: string, flowId: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, flowId, body);
  }

  private async request<T>(method: string, path: string, flowId: string, body?: unknown): Promise<T> {
    const token = this.tokens.getAccessToken();
    if (!token) throw new ApiError('Não autenticado');
    const idempotencyKey = method === 'GET' ? undefined : newIdempotencyKey();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...this.trace.headers(flowId),
    };
    const finalHeaders = idempotencyKey ? withIdempotencyKey(headers, idempotencyKey) : headers;
    const url = `${environment.apiBaseUrl}${path}`;
    try {
      if (method === 'GET') {
        return await firstValueFrom(this.http.get<T>(url, { headers: finalHeaders }));
      }
      if (method === 'POST') {
        return await firstValueFrom(this.http.post<T>(url, body ?? {}, { headers: finalHeaders }));
      }
      return await firstValueFrom(this.http.patch<T>(url, body, { headers: finalHeaders }));
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'error' in e) {
        const err = e as { error?: { message?: string }; status?: number };
        throw new ApiError(err.error?.message ?? 'Erro na requisição', err.status);
      }
      throw new ApiError('Erro na requisição');
    }
  }
}

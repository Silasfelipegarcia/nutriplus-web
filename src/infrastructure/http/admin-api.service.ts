import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenStorage } from '../auth/token-storage';
import { TraceService } from '../tracing/trace.service';
import { ApiError } from './api-error';

export interface AdminAccessSummary {
  pendingApprovalCount: number;
  loginEnabledCount: number;
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
}

export interface FeatureFlag {
  code: string;
  name: string;
  description?: string;
  enabled: boolean;
  updatedAt?: string;
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

  setLoginEnabled(userId: number, enabled: boolean): Promise<AdminUserAccess> {
    return this.patch<AdminUserAccess>(`/admin/access/users/${userId}/login-enabled`, { enabled }, 'admin-login-toggle');
  }

  featureFlags(): Promise<FeatureFlag[]> {
    return this.get<FeatureFlag[]>('/admin/feature-flags', 'admin-flags');
  }

  updateFeatureFlag(code: string, enabled: boolean): Promise<FeatureFlag> {
    return this.patch<FeatureFlag>(`/admin/feature-flags/${code}`, { enabled }, 'admin-flag-toggle');
  }

  private async get<T>(path: string, flowId: string): Promise<T> {
    return this.request<T>('GET', path, flowId);
  }

  private async patch<T>(path: string, body: unknown, flowId: string): Promise<T> {
    return this.request<T>('PATCH', path, flowId, body);
  }

  private async request<T>(method: string, path: string, flowId: string, body?: unknown): Promise<T> {
    const token = this.tokens.getAccessToken();
    if (!token) throw new ApiError('Não autenticado');
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...this.trace.headers(flowId),
    };
    const url = `${environment.apiBaseUrl}${path}`;
    try {
      if (method === 'GET') {
        return await firstValueFrom(this.http.get<T>(url, { headers }));
      }
      return await firstValueFrom(this.http.patch<T>(url, body, { headers }));
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'error' in e) {
        const err = e as { error?: { message?: string }; status?: number };
        throw new ApiError(err.error?.message ?? 'Erro na requisição', err.status);
      }
      throw new ApiError('Erro na requisição');
    }
  }
}

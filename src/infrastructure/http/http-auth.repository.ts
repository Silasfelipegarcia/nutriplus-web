import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TraceService } from '../tracing/trace.service';
import { TokenStorage } from '../auth/token-storage';
import { ApiError } from './api-error';
import { newIdempotencyKey, withIdempotencyKey } from './idempotency';
import { AuthResponse, User } from '../../domain/entities';
import { AuthRepository, NutritionistRegisterData } from '../../domain/repositories/auth.repository';

@Injectable()
export class HttpAuthRepository implements AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly trace = inject(TraceService);
  private readonly tokens = inject(TokenStorage);

  async login(email: string, password: string): Promise<AuthResponse> {
    const auth = await this.postAuth('/auth/login', { email, password }, 'login');
    this.tokens.setTokens(auth.token, auth.refreshToken);
    return auth;
  }

  async register(name: string, email: string, password: string, cpf: string): Promise<AuthResponse> {
    const auth = await this.postAuth('/auth/register', { name, email, password, cpf }, 'register');
    this.tokens.setTokens(auth.token, auth.refreshToken);
    return auth;
  }

  async registerNutritionist(data: NutritionistRegisterData): Promise<AuthResponse> {
    const auth = await this.postAuth('/auth/register/nutritionist', data, 'register-nutritionist');
    this.tokens.setTokens(auth.token, auth.refreshToken);
    return auth;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const auth = await this.postAuth('/auth/refresh', { refreshToken }, 'refresh-token');
    this.tokens.setTokens(auth.token, auth.refreshToken);
    return auth;
  }

  async getMe(): Promise<User> {
    return this.authorizedGet<User>('/users/me', 'users-me');
  }

  async acceptTerms(termsVersion: string, privacyVersion: string): Promise<User> {
    return this.authorizedPost<User>(
      '/users/me/accept-terms',
      { termsVersion, privacyVersion },
      'accept-terms',
    );
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const auth = await this.authorizedPut<AuthResponse>(
      '/users/me/password',
      { currentPassword, newPassword },
      'change-password',
    );
    this.tokens.setTokens(auth.token, auth.refreshToken);
    return auth;
  }

  async updateProfile(data: { name?: string; photoUrl?: string }): Promise<User> {
    return this.authorizedPut<User>('/users/me', data, 'update-profile');
  }

  private async postAuth(path: string, body: unknown, flowId: string): Promise<AuthResponse> {
    const idempotencyKey = newIdempotencyKey();
    try {
      return await firstValueFrom(
        this.http.post<AuthResponse>(`${environment.apiBaseUrl}${path}`, body, {
          headers: withIdempotencyKey(
            { 'Content-Type': 'application/json', ...this.trace.headers(flowId) },
            idempotencyKey,
          ),
        }),
      );
    } catch (e) {
      throw this.toApiError(e);
    }
  }

  private async authorizedGet<T>(path: string, flowId: string): Promise<T> {
    return this.authorized<T>('GET', path, flowId);
  }

  private async authorizedPost<T>(path: string, body: unknown, flowId: string): Promise<T> {
    return this.authorized<T>('POST', path, flowId, body);
  }

  private async authorizedPut<T>(path: string, body: unknown, flowId: string): Promise<T> {
    return this.authorized<T>('PUT', path, flowId, body);
  }

  private async authorized<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    flowId: string,
    body?: unknown,
  ): Promise<T> {
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
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: unknown,
  ): Promise<T> {
    try {
      const options = { headers, ...(body !== undefined ? { body } : {}) };
      switch (method) {
        case 'GET':
          return await firstValueFrom(this.http.get<T>(url, options));
        case 'POST':
          return await firstValueFrom(this.http.post<T>(url, body, { headers }));
        case 'PUT':
          return await firstValueFrom(this.http.put<T>(url, body, { headers }));
        case 'DELETE':
          return await firstValueFrom(this.http.delete<T>(url, { headers }));
        default:
          throw new ApiError('Método HTTP não suportado');
      }
    } catch (e) {
      throw this.toApiError(e);
    }
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string; correlationId?: string } | null;
      return new ApiError(
        body?.message ?? 'Erro na requisição',
        error.status,
        body?.correlationId,
      );
    }
    if (error instanceof ApiError) return error;
    return new ApiError('Erro na requisição');
  }
}

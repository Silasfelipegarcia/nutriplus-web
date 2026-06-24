import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TraceService } from '../tracing/trace.service';
import { ApiError } from './api-error';
import { newIdempotencyKey, withIdempotencyKey } from './idempotency';
import {
  BodyMeasurement,
  CareRelationship,
  Conversation,
  MealPlan,
  MealPlanGenerationStatus,
  NutritionistPublic,
  NutritionistRatingsSummary,
  NutritionProfile,
  PatientDossier,
  ProDashboard,
  ProInvite,
  ProPatientNutritionUpdate,
  ProPricingUpdate,
  ProProfileUpdate,
  StripeConnectResult,
} from '../../domain/entities';
import { ProRepository } from '../../domain/repositories/pro.repository';

@Injectable()
export class HttpProRepository implements ProRepository {
  private readonly http = inject(HttpClient);
  private readonly trace = inject(TraceService);

  getDashboard(): Promise<ProDashboard> {
    return this.get('/pro/dashboard', 'pro-dashboard');
  }

  getProfile(): Promise<NutritionistPublic> {
    return this.get('/pro/profile', 'pro-profile');
  }

  updateProfile(data: ProProfileUpdate): Promise<NutritionistPublic> {
    return this.put('/pro/profile', data, 'pro-profile-update');
  }

  updatePricing(data: ProPricingUpdate): Promise<NutritionistPublic> {
    return this.put('/pro/pricing', data, 'pro-pricing-update');
  }

  connectStripe(): Promise<StripeConnectResult> {
    return this.post('/pro/stripe/connect', {}, 'pro-stripe-connect');
  }

  getMyRatings(): Promise<NutritionistRatingsSummary> {
    return this.get('/pro/ratings', 'pro-ratings');
  }

  listPatients(): Promise<CareRelationship[]> {
    return this.get('/pro/patients', 'pro-patients');
  }

  getDossier(patientId: number): Promise<PatientDossier> {
    return this.get(`/pro/patients/${patientId}/dossier`, 'pro-dossier');
  }

  recordMeasurement(patientId: number, measurement: BodyMeasurement): Promise<BodyMeasurement> {
    return this.post(
      `/pro/patients/${patientId}/measurements`,
      {
        calculationMethod: measurement.bodyFatPercent != null ? 'SKINFOLD' : 'ESTIMATE',
        measuredOn: measurement.measuredOn,
        weightKg: measurement.weightKg,
        bodyFatPercent: measurement.bodyFatPercent,
        muscleMassKg: measurement.muscleMassKg,
        waistCm: measurement.waistCm,
        hipCm: measurement.hipCm,
        chestCm: measurement.chestCm,
        neckCm: measurement.neckCm,
        armRightCm: measurement.armRightCm,
        armLeftCm: measurement.armLeftCm,
        thighRightCm: measurement.thighRightCm,
        thighLeftCm: measurement.thighLeftCm,
        notes: measurement.notes,
      },
      'pro-measurement',
    );
  }

  updatePatientNutrition(patientId: number, data: ProPatientNutritionUpdate): Promise<NutritionProfile> {
    return this.put(`/pro/patients/${patientId}/nutrition-profile`, data, 'pro-nutrition-update');
  }

  generatePatientMealPlan(patientId: number): Promise<MealPlanGenerationStatus> {
    return this.post(`/pro/patients/${patientId}/meal-plans/generate`, {}, 'pro-generate-plan');
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

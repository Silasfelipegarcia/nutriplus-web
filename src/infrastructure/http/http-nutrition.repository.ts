import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TraceService } from '../tracing/trace.service';
import { TokenStorage } from '../auth/token-storage';
import { ApiError } from './api-error';
import {
  BodyMeasurement,
  CheckinStats,
  EvolutionReport,
  MealPlan,
  MealPlanGenerationStatus,
  NutritionProfile,
  ProgressReview,
  ProgressSchedule,
  ShoppingList,
  SportCatalogItem,
  TodayCheckins,
  TrainingProfile,
} from '../../domain/entities';
import { NutritionRepository } from '../../domain/repositories/nutrition.repository';
import { HttpAuthRepository } from './http-auth.repository';

function toNutritionProfileRequest(profile: Partial<NutritionProfile>): Record<string, unknown> {
  const goalAliases: Record<string, string> = {
    MAINTAIN: 'MAINTAIN_WEIGHT',
    GAIN_WEIGHT: 'GAIN_MASS',
  };
  const activityAliases: Record<string, string> = {
    ACTIVE: 'INTENSE',
    VERY_ACTIVE: 'INTENSE',
  };
  const restrictionAliases: Record<string, string> = {
    LACTOSE_FREE: 'LACTOSE',
    GLUTEN_FREE: 'GLUTEN',
  };

  const goal = profile.goal ? (goalAliases[profile.goal] ?? profile.goal) : profile.goal;
  const activityLevel = profile.activityLevel
    ? (activityAliases[profile.activityLevel] ?? profile.activityLevel)
    : profile.activityLevel;
  const restriction = profile.restriction
    ? (restrictionAliases[profile.restriction] ?? profile.restriction)
    : profile.restriction;

  return {
    age: Number(profile.age),
    sex: profile.sex,
    heightCm: Number(profile.heightCm),
    currentWeightKg: Number(profile.currentWeightKg),
    targetWeightKg: Number(profile.targetWeightKg),
    goal,
    activityLevel,
    dietaryPreference: profile.dietaryPreference,
    restriction,
    agentPersona: profile.agentPersona,
    foodBudgetLevel: profile.foodBudgetLevel ?? 'MODERATE',
    ...(profile.foodLikes ? { foodLikes: profile.foodLikes } : {}),
    ...(profile.foodDislikes ? { foodDislikes: profile.foodDislikes } : {}),
    ...(profile.mealNotes ? { mealNotes: profile.mealNotes } : {}),
    ...(profile.wakeTime ? { wakeTime: profile.wakeTime } : {}),
    ...(profile.sleepTime ? { sleepTime: profile.sleepTime } : {}),
    ...(profile.healthConditions ? { healthConditions: profile.healthConditions } : {}),
    ...(profile.medications ? { medications: profile.medications } : {}),
    ...(profile.allergies ? { allergies: profile.allergies } : {}),
    ...(profile.healthNotes ? { healthNotes: profile.healthNotes } : {}),
  };
}

@Injectable()
export class HttpNutritionRepository implements NutritionRepository {
  private readonly http = inject(HttpClient);
  private readonly trace = inject(TraceService);
  private readonly tokens = inject(TokenStorage);
  private readonly authRepo = inject(HttpAuthRepository);

  getNutritionProfile(): Promise<NutritionProfile> {
    return this.get('/nutrition-profile', 'nutrition-profile');
  }

  saveNutritionProfile(profile: Partial<NutritionProfile>): Promise<NutritionProfile> {
    return this.post('/nutrition-profile', toNutritionProfileRequest(profile), 'onboarding-metrics');
  }

  completeOnboarding(
    profile: Partial<NutritionProfile>,
    athleteModeEnabled: boolean,
    activities: TrainingProfile['activities'],
  ): Promise<NutritionProfile> {
    return this.post(
      '/onboarding/complete',
      {
        nutritionProfile: toNutritionProfileRequest(profile),
        athleteModeEnabled,
        activities: activities.map((a) => ({
          sportType: a.sportType,
          daysPerWeek: a.daysPerWeek,
          minutesPerSession: a.minutesPerSession,
        })),
      },
      'onboarding-complete',
    );
  }

  requestMealPlanGeneration(): Promise<MealPlanGenerationStatus> {
    return this.post('/meal-plans/generate', {}, 'generate-meal-plan');
  }

  getMealPlanGenerationStatus(): Promise<MealPlanGenerationStatus> {
    return this.get('/meal-plans/generation-status', 'meal-plan-generation-status');
  }

  getLatestMealPlan(): Promise<MealPlan> {
    return this.get('/meal-plans/latest', 'meal-plan-latest');
  }

  getLatestShoppingList(): Promise<ShoppingList> {
    return this.get('/shopping-list/latest', 'shopping-list-latest');
  }

  getTodayCheckins(): Promise<TodayCheckins> {
    return this.get('/checkins/today', 'checkins-today');
  }

  async saveCheckin(mealId: number, status: string, notes?: string): Promise<void> {
    await this.post('/checkins', { mealId, status, ...(notes ? { notes } : {}) }, 'checkin-save');
  }

  async getCheckinStats(): Promise<CheckinStats> {
    const raw = await this.get<{
      streakDays?: number;
      currentStreak?: number;
      weekAdherencePercent?: number;
    }>('/checkins/stats', 'checkins-stats');
    return {
      currentStreak: raw.currentStreak ?? raw.streakDays ?? 0,
      weekAdherencePercent: raw.weekAdherencePercent ?? 0,
    };
  }

  getProgressSchedule(): Promise<ProgressSchedule> {
    return this.get('/progress/schedule', 'progress-schedule');
  }

  getLatestBodyMeasurement(): Promise<BodyMeasurement> {
    return this.get('/progress/measurements/latest', 'progress-measurement-latest');
  }

  saveBodyMeasurement(measurement: BodyMeasurement): Promise<BodyMeasurement> {
    return this.post('/progress/measurements', measurement, 'progress-measurement');
  }

  generateProgressReview(): Promise<ProgressReview> {
    return this.post('/progress/reviews', {}, 'progress-review');
  }

  getLatestProgressReview(): Promise<ProgressReview> {
    return this.get('/progress/reviews/latest', 'progress-review-latest');
  }

  getEvolutionReport(): Promise<EvolutionReport> {
    return this.get('/progress/evolution', 'progress-evolution');
  }

  getSportCatalog(): Promise<SportCatalogItem[]> {
    return this.get('/training/sports', 'training-sports');
  }

  getTrainingProfile(): Promise<TrainingProfile> {
    return this.get('/training/profile', 'training-profile');
  }

  saveTrainingProfile(
    athleteModeEnabled: boolean,
    activities: TrainingProfile['activities'],
  ): Promise<TrainingProfile> {
    return this.put(
      '/training/profile',
      { athleteModeEnabled, activities },
      'training-profile-save',
    );
  }

  applyTrainingToPlan(): Promise<NutritionProfile> {
    return this.post('/training/apply', {}, 'training-apply');
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

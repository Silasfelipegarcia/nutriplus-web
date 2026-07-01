import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TraceService } from '../tracing/trace.service';
import { ApiError } from './api-error';
import { newIdempotencyKey, withIdempotencyKey } from './idempotency';
import {
  BodyMeasurement,
  CheckinStats,
  EvolutionReport,
  MealPlan,
  MealPlanGenerationStatus,
  NutritionProfile,
  PlanAdherenceHistory,
  GoalTimeline,
  ProgressReview,
  ProgressSchedule,
  ShoppingList,
  SportCatalogItem,
  TodayCheckins,
  TrainingProfile,
} from '../../domain/entities';
import { NutritionRepository } from '../../domain/repositories/nutrition.repository';
import { defaultSportCatalog, mergeSportCatalog } from '../../presentation/core/sport-catalog';

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
    ...(profile.birthDate ? { birthDate: profile.birthDate } : {}),
    ...(profile.stateCode ? { stateCode: profile.stateCode } : {}),
    ...(profile.city ? { city: profile.city } : {}),
    ...(profile.chewingDifficulty ? { chewingDifficulty: profile.chewingDifficulty } : {}),
    ...(profile.seniorWeightLossAck != null ? { seniorWeightLossAck: profile.seniorWeightLossAck } : {}),
    ...(profile.goalTargetWeeks != null ? { goalTargetWeeks: profile.goalTargetWeeks } : {}),
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
    ...(profile.calculationMethod ? { calculationMethod: profile.calculationMethod } : {}),
    ...(profile.bodyFatPercent != null ? { bodyFatPercent: profile.bodyFatPercent } : {}),
    ...(profile.muscleMassKg != null ? { muscleMassKg: profile.muscleMassKg } : {}),
    ...(profile.foodLikes ? { foodLikes: profile.foodLikes } : {}),
    ...(profile.foodDislikes ? { foodDislikes: profile.foodDislikes } : {}),
    ...(profile.mealNotes ? { mealNotes: profile.mealNotes } : {}),
    ...(profile.eatsBreakfast != null ? { eatsBreakfast: profile.eatsBreakfast } : {}),
    ...(profile.eatsLunch != null ? { eatsLunch: profile.eatsLunch } : {}),
    ...(profile.eatsAfternoonSnack != null ? { eatsAfternoonSnack: profile.eatsAfternoonSnack } : {}),
    ...(profile.eatsDinner != null ? { eatsDinner: profile.eatsDinner } : {}),
    ...(profile.openToRoutineAdjustment != null
      ? { openToRoutineAdjustment: profile.openToRoutineAdjustment }
      : {}),
    ...(profile.freeExtras?.length ? { freeExtras: profile.freeExtras } : {}),
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
          ...(a.customLabel ? { customLabel: a.customLabel } : {}),
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

  async deleteCheckin(mealId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${environment.apiBaseUrl}/checkins/${mealId}`, {
        headers: this.trace.headers('checkin-delete'),
      }),
    );
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

  getCheckinAdherence(days = 7): Promise<PlanAdherenceHistory> {
    return this.get(`/checkins/adherence?days=${days}`, 'checkins-adherence');
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

  getGoalTimeline(): Promise<GoalTimeline> {
    return this.get('/progress/goal-timeline', 'progress-goal-timeline');
  }

  async getSportCatalog(): Promise<SportCatalogItem[]> {
    if (this.sportCatalogCache) {
      return this.sportCatalogCache;
    }
    try {
      const fromApi = await firstValueFrom(
        this.http.get<SportCatalogItem[]>(`${environment.apiBaseUrl}/training/sports`, {
          headers: this.trace.headers('training-sports'),
        }),
      );
      const { mergeSportCatalog } = await import('../../presentation/core/sport-catalog');
      this.sportCatalogCache = mergeSportCatalog(fromApi);
      return this.sportCatalogCache;
    } catch {
      this.sportCatalogCache = defaultSportCatalog();
      return this.sportCatalogCache;
    }
  }

  private sportCatalogCache: SportCatalogItem[] | null = null;

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

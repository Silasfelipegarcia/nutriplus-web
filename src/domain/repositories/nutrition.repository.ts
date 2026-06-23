import { InjectionToken } from '@angular/core';
import {
  CheckinStats,
  MealPlan,
  MealPlanGenerationStatus,
  NutritionProfile,
  ProgressReview,
  ProgressSchedule,
  ShoppingList,
  TodayCheckins,
  BodyMeasurement,
  EvolutionReport,
  TrainingProfile,
  SportCatalogItem,
} from '../entities';

export interface NutritionRepository {
  getNutritionProfile(): Promise<NutritionProfile>;
  saveNutritionProfile(profile: Partial<NutritionProfile>): Promise<NutritionProfile>;
  completeOnboarding(
    profile: Partial<NutritionProfile>,
    athleteModeEnabled: boolean,
    activities: TrainingProfile['activities'],
  ): Promise<NutritionProfile>;
  requestMealPlanGeneration(): Promise<MealPlanGenerationStatus>;
  getMealPlanGenerationStatus(): Promise<MealPlanGenerationStatus>;
  getLatestMealPlan(): Promise<MealPlan>;
  getLatestShoppingList(): Promise<ShoppingList>;
  getTodayCheckins(): Promise<TodayCheckins>;
  saveCheckin(mealId: number, status: string, notes?: string): Promise<void>;
  getCheckinStats(): Promise<CheckinStats>;
  getProgressSchedule(): Promise<ProgressSchedule>;
  getLatestBodyMeasurement(): Promise<BodyMeasurement>;
  saveBodyMeasurement(measurement: BodyMeasurement): Promise<BodyMeasurement>;
  generateProgressReview(): Promise<ProgressReview>;
  getLatestProgressReview(): Promise<ProgressReview>;
  getEvolutionReport(): Promise<EvolutionReport>;
  getSportCatalog(): Promise<SportCatalogItem[]>;
  getTrainingProfile(): Promise<TrainingProfile>;
  saveTrainingProfile(athleteModeEnabled: boolean, activities: TrainingProfile['activities']): Promise<TrainingProfile>;
  applyTrainingToPlan(): Promise<NutritionProfile>;
}

export const NUTRITION_REPOSITORY = new InjectionToken<NutritionRepository>('NUTRITION_REPOSITORY');

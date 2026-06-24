import { InjectionToken } from '@angular/core';
import {
  BodyMeasurement,
  CareRating,
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
} from '../entities';

export interface ProRepository {
  getDashboard(): Promise<ProDashboard>;
  getProfile(): Promise<NutritionistPublic>;
  updateProfile(data: ProProfileUpdate): Promise<NutritionistPublic>;
  updatePricing(data: ProPricingUpdate): Promise<NutritionistPublic>;
  connectStripe(): Promise<StripeConnectResult>;
  getMyRatings(): Promise<NutritionistRatingsSummary>;
  listPatients(): Promise<CareRelationship[]>;
  getDossier(patientId: number): Promise<PatientDossier>;
  recordMeasurement(patientId: number, measurement: BodyMeasurement): Promise<BodyMeasurement>;
  updatePatientNutrition(patientId: number, data: ProPatientNutritionUpdate): Promise<NutritionProfile>;
  generatePatientMealPlan(patientId: number): Promise<MealPlanGenerationStatus>;
  listPatientMealPlans(patientId: number): Promise<MealPlan[]>;
  publishMealPlan(patientId: number, mealPlanId: number, notes?: string): Promise<MealPlan>;
  createInvite(maxUses?: number, expiresInDays?: number): Promise<ProInvite>;
  listConversations(): Promise<Conversation[]>;
  getConversation(threadId: number): Promise<Conversation>;
  sendMessage(threadId: number, body: string): Promise<void>;
}

export interface CareRepository {
  listNutritionists(state?: string, city?: string): Promise<NutritionistPublic[]>;
  getNutritionist(id: number): Promise<NutritionistPublic>;
  getNutritionistRatings(id: number): Promise<NutritionistRatingsSummary>;
  getMyCare(): Promise<CareRelationship[]>;
  acceptInvite(code: string, consentVersion: string): Promise<CareRelationship>;
  requestCare(nutritionistId: number): Promise<CareRelationship>;
  rateCare(careRelationshipId: number, stars: number, comment?: string): Promise<CareRating>;
}

export const PRO_REPOSITORY = new InjectionToken<ProRepository>('PRO_REPOSITORY');
export const CARE_REPOSITORY = new InjectionToken<CareRepository>('CARE_REPOSITORY');

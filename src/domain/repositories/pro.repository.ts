import { InjectionToken } from '@angular/core';
import {
  BodyMeasurement,
  CareRating,
  CareRelationship,
  Conversation,
  PaymentIntentResult,
  MealPlan,
  MealPlanGenerationStatus,
  NutritionistPublic,
  NutritionistRatingsSummary,
  NutritionProfile,
  NutritionistPortfolioItem,
  PortfolioItemInput,
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
  generatePatientMealPlan(patientId: number, nutritionistNotes?: string): Promise<MealPlanGenerationStatus>;
  listPatientMealPlans(patientId: number): Promise<MealPlan[]>;
  publishMealPlan(patientId: number, mealPlanId: number, notes?: string, changesSummary?: string): Promise<MealPlan>;
  getPortfolio(): Promise<NutritionistPortfolioItem[]>;
  updatePortfolio(items: PortfolioItemInput[]): Promise<NutritionistPortfolioItem[]>;
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
  requestCare(nutritionistId: number, preferredCareMode?: string): Promise<CareRelationship>;
  payConsultation(nutritionistId: number): Promise<PaymentIntentResult>;
  rateCare(careRelationshipId: number, stars: number, comment?: string): Promise<CareRating>;
  listConversations(): Promise<Conversation[]>;
  getConversation(threadId: number): Promise<Conversation>;
  sendMessage(threadId: number, body: string): Promise<void>;
}

export const PRO_REPOSITORY = new InjectionToken<ProRepository>('PRO_REPOSITORY');
export const CARE_REPOSITORY = new InjectionToken<CareRepository>('CARE_REPOSITORY');

import { InjectionToken } from '@angular/core';
import {
  CareRelationship,
  Conversation,
  NutritionistPublic,
  PatientDossier,
  ProDashboard,
  ProInvite,
  MealPlan,
} from '../entities';

export interface ProRepository {
  getDashboard(): Promise<ProDashboard>;
  listPatients(): Promise<CareRelationship[]>;
  getDossier(patientId: number): Promise<PatientDossier>;
  listPatientMealPlans(patientId: number): Promise<MealPlan[]>;
  publishMealPlan(patientId: number, mealPlanId: number, notes?: string): Promise<MealPlan>;
  createInvite(maxUses?: number, expiresInDays?: number): Promise<ProInvite>;
  listConversations(): Promise<Conversation[]>;
  getConversation(threadId: number): Promise<Conversation>;
  sendMessage(threadId: number, body: string): Promise<void>;
}

export interface CareRepository {
  listNutritionists(): Promise<NutritionistPublic[]>;
  acceptInvite(code: string, consentVersion: string): Promise<CareRelationship>;
  requestCare(nutritionistId: number): Promise<CareRelationship>;
}

export const PRO_REPOSITORY = new InjectionToken<ProRepository>('PRO_REPOSITORY');
export const CARE_REPOSITORY = new InjectionToken<CareRepository>('CARE_REPOSITORY');

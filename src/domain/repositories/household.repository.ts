import { InjectionToken } from '@angular/core';
import {
  AcceptHouseholdInvitationResult,
  HouseholdInfo,
  HouseholdInvitationCreated,
  HouseholdShoppingList,
  PlanInvitationPreview,
} from '../entities/household.model';

export interface HouseholdRepository {
  getMyHousehold(): Promise<HouseholdInfo | null>;
  shareMealPlan(mealPlanId?: number): Promise<HouseholdInfo>;
  createInvitation(email: string, name?: string): Promise<HouseholdInvitationCreated>;
  previewInvitation(token: string): Promise<PlanInvitationPreview>;
  acceptInvitation(token: string): Promise<AcceptHouseholdInvitationResult>;
  getAggregatedShoppingList(): Promise<HouseholdShoppingList>;
}

export const HOUSEHOLD_REPOSITORY = new InjectionToken<HouseholdRepository>('HOUSEHOLD_REPOSITORY');

export interface HouseholdMember {
  userId: number;
  name: string;
  role: string;
  status: string;
}

export interface HouseholdInvitation {
  id: number;
  email: string;
  name?: string;
  status: string;
  expiresAt?: string;
}

export interface HouseholdInfo {
  id: number;
  ownerUserId: number;
  ownerName: string;
  baseMealPlanId?: number;
  memberCount: number;
  maxMembers: number;
  members: HouseholdMember[];
  pendingInvitations: HouseholdInvitation[];
  createdAt?: string;
}

export interface HouseholdInvitationCreated {
  invitationId: number;
  inviteeEmail: string;
  inviteeName?: string;
  inviteUrl: string;
  expiresAt?: string;
}

export interface PlanInvitationPreview {
  token: string;
  inviterName: string;
  inviteeName?: string;
  expired: boolean;
  requiresRegistration: boolean;
  expiresAt?: string;
}

export interface AcceptHouseholdInvitationResult {
  householdId: number;
  planGenerationStarted: boolean;
  message: string;
}

export interface AggregatedShoppingItem {
  itemName: string;
  quantity: string;
  category?: string;
  memberCount: number;
}

export interface HouseholdShoppingList {
  householdId: number;
  items: AggregatedShoppingItem[];
}

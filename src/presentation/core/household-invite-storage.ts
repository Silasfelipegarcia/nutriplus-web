const PENDING_TOKEN_KEY = 'pending_household_invite_token';

export class HouseholdInviteStorage {
  static savePendingToken(token: string): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(PENDING_TOKEN_KEY, token);
  }

  static readPendingToken(): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(PENDING_TOKEN_KEY);
  }

  static clearPendingToken(): void {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem(PENDING_TOKEN_KEY);
  }
}

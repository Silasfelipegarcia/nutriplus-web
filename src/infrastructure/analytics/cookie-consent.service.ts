import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export const COOKIE_CONSENT_KEY = 'nutri_cookie_consent';
export const COOKIE_CONSENT_VERSION = 2;

export interface CookieConsentState {
  version: typeof COOKIE_CONSENT_VERSION;
  essential: true;
  analytics: boolean;
  decidedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly subject = new BehaviorSubject<CookieConsentState | null>(null);

  readonly consent$: Observable<CookieConsentState | null> = this.subject.asObservable();

  hasDecided(): boolean {
    return this.subject.value !== null;
  }

  hasAnalyticsConsent(): boolean {
    return this.subject.value?.analytics === true;
  }

  getState(): CookieConsentState | null {
    return this.subject.value;
  }

  syncFromStorage(): void {
    const loaded = this.load();
    if (JSON.stringify(loaded) !== JSON.stringify(this.subject.value)) {
      this.subject.next(loaded);
    }
  }

  acceptAll(): void {
    this.persist({ essential: true, analytics: true });
  }

  rejectOptional(): void {
    this.persist({ essential: true, analytics: false });
  }

  clearDecision(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
    }
    this.subject.next(null);
  }

  private persist(partial: Pick<CookieConsentState, 'essential' | 'analytics'>): void {
    const state: CookieConsentState = {
      version: COOKIE_CONSENT_VERSION,
      essential: true,
      analytics: partial.analytics,
      decidedAt: new Date().toISOString(),
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(state));
    }
    this.subject.next(state);
  }

  private load(): CookieConsentState | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as CookieConsentState;
      if (parsed.version === COOKIE_CONSENT_VERSION) {
        return parsed;
      }
    } catch {
      // valor legado inválido — tratar como sem decisão
    }

    localStorage.removeItem(COOKIE_CONSENT_KEY);
    return null;
  }
}

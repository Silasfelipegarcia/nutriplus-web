import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const ACCESS_KEY = 'nutri_access_token';
const REFRESH_KEY = 'nutri_refresh_token';
const SESSION_KEY = 'nutri_session_id';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(REFRESH_KEY);
  }

  setTokens(access: string, refresh?: string): void {
    if (!this.isBrowser) return;
    sessionStorage.setItem(ACCESS_KEY, access);
    if (refresh) sessionStorage.setItem(REFRESH_KEY, refresh);
  }

  clear(): void {
    if (!this.isBrowser) return;
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  }

  getOrCreateSessionId(): string {
    if (!this.isBrowser) return 'ssr';
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }
}

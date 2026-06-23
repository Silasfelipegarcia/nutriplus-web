import { Injectable, inject } from '@angular/core';
import { TokenStorage } from '../auth/token-storage';
import { HttpAuthRepository } from './http-auth.repository';

/** Refresh token com lock — evita múltiplos POST /auth/refresh em paralelo. */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly tokens = inject(TokenStorage);
  private readonly authRepo = inject(HttpAuthRepository);
  private refreshPromise: Promise<void> | null = null;

  async refreshAccessToken(): Promise<boolean> {
    const refresh = this.tokens.getRefreshToken();
    if (!refresh) return false;

    if (!this.refreshPromise) {
      this.refreshPromise = this.authRepo
        .refreshToken(refresh)
        .then(() => undefined)
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    try {
      await this.refreshPromise;
      return true;
    } catch {
      this.tokens.clear();
      return false;
    }
  }
}

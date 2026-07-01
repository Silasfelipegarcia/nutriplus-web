import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, makeStateKey, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublicFeatureFlag {
  code: string;
  name: string;
  description?: string;
  category?: string;
  enabled: boolean;
}

const FEATURE_FLAGS_STATE_KEY = makeStateKey<PublicFeatureFlag[]>('public-feature-flags');
const STORAGE_KEY = 'nutriplus.public-feature-flags.v1';
const STORAGE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;

/** Defaults seguros quando a API não responde — cadastro fechado, features opcionais desligadas. */
const DEFAULT_FLAGS: PublicFeatureFlag[] = [
  { code: 'REGISTRATION_OPEN', name: 'Cadastro aberto', enabled: false },
  { code: 'ATHLETE_MODE', name: 'Modo atleta', enabled: false },
  { code: 'MARKETPLACE_NUTRITIONISTS', name: 'Marketplace', enabled: false },
  { code: 'AI_MEAL_PLAN', name: 'Plano IA', enabled: true },
  { code: 'SUBSCRIPTION_BILLING', name: 'Assinatura', enabled: false },
  { code: 'APP_STORE_LINKS', name: 'Links das lojas', enabled: true },
  { code: 'SHOPPING_FINANCE', name: 'Economia', enabled: false },
  { code: 'UNLIMITED_PLAN_REGEN', name: 'Regeneração ilimitada', enabled: false },
];

interface StoredFlags {
  fetchedAt: number;
  flags: PublicFeatureFlag[];
}

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private cache: PublicFeatureFlag[] | null = null;
  private refreshPromise: Promise<PublicFeatureFlag[]> | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.hydrateFromStorage();
      if (!this.cache) {
        this.cache = [...DEFAULT_FLAGS];
      }
      void this.prefetch();
    }
  }

  cacheReady(): boolean {
    return this.cache !== null;
  }

  /** Carrega flags em background — não bloqueia bootstrap. */
  prefetch(): Promise<PublicFeatureFlag[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve(this.resolveFlags());
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.fetchFromNetwork()
      .catch(() => this.resolveFlags())
      .finally(() => {
        this.refreshPromise = null;
      });
    return this.refreshPromise;
  }

  async list(): Promise<PublicFeatureFlag[]> {
    if (this.cache) {
      if (isPlatformBrowser(this.platformId)) {
        void this.prefetch();
      }
      return this.cache;
    }

    const transferred = this.transferState.get(FEATURE_FLAGS_STATE_KEY, null);
    if (transferred) {
      this.applyCache(transferred);
      this.transferState.remove(FEATURE_FLAGS_STATE_KEY);
      if (isPlatformBrowser(this.platformId)) {
        void this.prefetch();
      }
      return this.cache!;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.hydrateFromStorage();
      if (this.cache) {
        void this.prefetch();
        return this.cache;
      }
    }

    if (!isPlatformBrowser(this.platformId)) {
      return this.applyFallbackDefaults();
    }

    try {
      return await this.withTimeout(this.prefetch(), FETCH_TIMEOUT_MS);
    } catch {
      return this.applyFallbackDefaults();
    }
  }

  async isEnabled(code: string): Promise<boolean> {
    const flags = await this.list();
    return flags.find((flag) => flag.code === code)?.enabled ?? false;
  }

  isEnabledSync(code: string): boolean {
    const flags = this.cache ?? DEFAULT_FLAGS;
    return flags.find((flag) => flag.code === code)?.enabled ?? false;
  }

  isRegistrationOpen(): Promise<boolean> {
    return this.isEnabled('REGISTRATION_OPEN');
  }

  isRegistrationOpenSync(): boolean {
    return this.isEnabledSync('REGISTRATION_OPEN');
  }

  isAppStoreLinksVisible(): Promise<boolean> {
    return this.isEnabled('APP_STORE_LINKS');
  }

  isAppStoreLinksVisibleSync(): boolean {
    return this.isEnabledSync('APP_STORE_LINKS');
  }

  isShoppingFinanceEnabled(): Promise<boolean> {
    return this.isEnabled('SHOPPING_FINANCE');
  }

  isShoppingFinanceEnabledSync(): boolean {
    return this.isEnabledSync('SHOPPING_FINANCE');
  }

  clearCache(): void {
    this.cache = null;
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore quota / private mode
      }
    }
  }

  private async fetchFromNetwork(): Promise<PublicFeatureFlag[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return this.resolveFlags();
    }

    const flags = await firstValueFrom(
      this.http.get<PublicFeatureFlag[]>(`${environment.apiBaseUrl}/feature-flags`),
    );

    if (!isPlatformBrowser(this.platformId)) {
      this.transferState.set(FEATURE_FLAGS_STATE_KEY, flags);
    }

    this.applyCache(flags);
    this.persistToStorage(flags);
    return flags;
  }

  private resolveFlags(): PublicFeatureFlag[] {
    return this.cache ?? [...DEFAULT_FLAGS];
  }

  private applyCache(flags: PublicFeatureFlag[]): void {
    this.cache = flags;
  }

  private applyFallbackDefaults(): PublicFeatureFlag[] {
    if (!this.cache) {
      this.cache = [...DEFAULT_FLAGS];
    }
    return this.cache;
  }

  private hydrateFromStorage(): void {
    if (!isPlatformBrowser(this.platformId) || this.cache) {
      return;
    }

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as StoredFlags;
      if (!parsed?.flags?.length || !parsed.fetchedAt) {
        return;
      }
      if (Date.now() - parsed.fetchedAt > STORAGE_TTL_MS) {
        return;
      }
      this.applyCache(parsed.flags);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  private persistToStorage(flags: PublicFeatureFlag[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const payload: StoredFlags = { fetchedAt: Date.now(), flags };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / private mode
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('feature-flags timeout')), ms);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}

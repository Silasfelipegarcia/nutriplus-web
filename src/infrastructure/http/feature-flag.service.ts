import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, makeStateKey, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublicFeatureFlag {
  code: string;
  name: string;
  description?: string;
  enabled: boolean;
}

const FEATURE_FLAGS_STATE_KEY = makeStateKey<PublicFeatureFlag[]>('public-feature-flags');

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private cache: PublicFeatureFlag[] | null = null;

  cacheReady(): boolean {
    return this.cache !== null;
  }

  async list(): Promise<PublicFeatureFlag[]> {
    if (this.cache) {
      return this.cache;
    }

    const transferred = this.transferState.get(FEATURE_FLAGS_STATE_KEY, null);
    if (transferred) {
      this.cache = transferred;
      this.transferState.remove(FEATURE_FLAGS_STATE_KEY);
      return this.cache;
    }

    this.cache = await firstValueFrom(
      this.http.get<PublicFeatureFlag[]>(`${environment.apiBaseUrl}/feature-flags`),
    );

    if (!isPlatformBrowser(this.platformId)) {
      this.transferState.set(FEATURE_FLAGS_STATE_KEY, this.cache);
    }

    return this.cache;
  }

  async isEnabled(code: string): Promise<boolean> {
    const flags = await this.list();
    return flags.find((flag) => flag.code === code)?.enabled ?? false;
  }

  isEnabledSync(code: string): boolean {
    if (!this.cache) {
      return false;
    }
    return this.cache.find((flag) => flag.code === code)?.enabled ?? false;
  }

  /** Cadastro aberto = fluxo normal; desligado = lista de espera beta. */
  isRegistrationOpen(): Promise<boolean> {
    return this.isEnabled('REGISTRATION_OPEN');
  }

  isRegistrationOpenSync(): boolean {
    return this.isEnabledSync('REGISTRATION_OPEN');
  }

  /** Links para App Store / Google Play visíveis no site. */
  isAppStoreLinksVisible(): Promise<boolean> {
    return this.isEnabled('APP_STORE_LINKS');
  }

  isAppStoreLinksVisibleSync(): boolean {
    return this.isEnabledSync('APP_STORE_LINKS');
  }

  clearCache(): void {
    this.cache = null;
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublicFeatureFlag {
  code: string;
  name: string;
  description?: string;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly http = inject(HttpClient);
  private cache: PublicFeatureFlag[] | null = null;

  async list(): Promise<PublicFeatureFlag[]> {
    if (this.cache) return this.cache;
    this.cache = await firstValueFrom(
      this.http.get<PublicFeatureFlag[]>(`${environment.apiBaseUrl}/feature-flags`),
    );
    return this.cache;
  }

  async isEnabled(code: string): Promise<boolean> {
    const flags = await this.list();
    return flags.find((f) => f.code === code)?.enabled ?? false;
  }

  /** Cadastro aberto = fluxo normal; desligado = lista de espera beta. */
  isRegistrationOpen(): Promise<boolean> {
    return this.isEnabled('REGISTRATION_OPEN');
  }

  clearCache(): void {
    this.cache = null;
  }
}

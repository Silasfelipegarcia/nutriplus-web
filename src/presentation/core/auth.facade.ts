import { Injectable, inject, signal, computed } from '@angular/core';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository';
import { TokenStorage } from '../../infrastructure/auth/token-storage';
import { User, userHasAcceptedLegal } from '../../domain/entities';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authRepo = inject(AUTH_REPOSITORY);
  private readonly tokens = inject(TokenStorage);

  readonly user = signal<User | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly needsOnboarding = computed(() => {
    const u = this.user();
    return u !== null && !u.hasNutritionProfile;
  });
  readonly needsTerms = computed(() => {
    const u = this.user();
    return u !== null && u.hasNutritionProfile && !userHasAcceptedLegal(u);
  });

  async bootstrap(): Promise<void> {
    const token = this.tokens.getAccessToken();
    if (!token) return;
    this.loading.set(true);
    try {
      const me = await this.authRepo.getMe();
      this.user.set(me);
    } catch {
      this.tokens.clear();
      this.user.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const auth = await this.authRepo.login(email, password);
      this.user.set(auth.user);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao entrar');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async register(name: string, email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const auth = await this.authRepo.register(name, email, password);
      this.user.set(auth.user);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao cadastrar');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async acceptTerms(termsVersion: string, privacyVersion: string): Promise<void> {
    const updated = await this.authRepo.acceptTerms(termsVersion, privacyVersion);
    this.user.set(updated);
  }

  async refreshUser(): Promise<void> {
    const me = await this.authRepo.getMe();
    this.user.set(me);
  }

  logout(): void {
    this.tokens.clear();
    this.user.set(null);
  }
}

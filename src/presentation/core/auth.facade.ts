import { Injectable, inject, signal, computed } from '@angular/core';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository';
import { PatientRegistrationData } from '../../domain/auth/registration.model';
import { TokenStorage } from '../../infrastructure/auth/token-storage';
import { AnalyticsService } from '../../infrastructure/analytics/analytics.service';
import { User, userHasAcceptedLegal } from '../../domain/entities';
import { jwtRoles, resolvePrimaryRole } from './jwt.util';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authRepo = inject(AUTH_REPOSITORY);
  private readonly tokens = inject(TokenStorage);
  private readonly analytics = inject(AnalyticsService);

  readonly user = signal<User | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly registerMessage = signal<string | null>(null);

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
      this.syncAnalyticsUser(me);
    } catch {
      this.tokens.clear();
      this.user.set(null);
      this.analytics.clearUser();
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
      this.syncAnalyticsUser(auth.user);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao entrar');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async register(name: string, email: string, password: string, cpf: string, birthDate: string, contactPhone: string): Promise<void> {
    await this.submitRegistration(() =>
      this.authRepo.register(name, email, password, cpf, birthDate, contactPhone),
    );
  }

  async betaRequest(name: string, email: string, password: string, cpf: string, birthDate: string, contactPhone: string): Promise<void> {
    await this.submitRegistration(() =>
      this.authRepo.betaRequest(name, email, password, cpf, birthDate, contactPhone),
    );
  }

  async registerWithAttribution(data: PatientRegistrationData): Promise<void> {
    await this.submitRegistration(() => this.authRepo.registerPatient(data));
  }

  async betaRequestWithAttribution(data: PatientRegistrationData): Promise<void> {
    await this.submitRegistration(() => this.authRepo.betaRequestPatient(data));
  }

  async registerNutritionist(data: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    contactPhone: string;
    crn: string;
    bio?: string;
    specialties?: string;
  }): Promise<void> {
    await this.submitRegistration(() => this.authRepo.registerNutritionist(data));
  }

  async betaRequestNutritionist(data: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    contactPhone: string;
    crn: string;
    bio?: string;
    specialties?: string;
  }): Promise<void> {
    await this.submitRegistration(() => this.authRepo.betaRequestNutritionist(data));
  }

  private async submitRegistration(action: () => Promise<{ message: string }>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.registerMessage.set(null);
    try {
      const result = await action();
      this.registerMessage.set(result.message);
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
    this.syncAnalyticsUser(me);
  }

  logout(): void {
    this.analytics.trackLogout('manual');
    this.tokens.clear();
    this.user.set(null);
  }

  primaryRole(): string {
    return resolvePrimaryRole(jwtRoles(this.tokens.getAccessToken()));
  }

  private syncAnalyticsUser(user: User): void {
    const role = this.primaryRole();
    this.analytics.setUser(String(user.id), role);
  }
}

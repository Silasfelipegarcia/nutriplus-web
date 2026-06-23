import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { AuthFacade } from '../../core/auth.facade';
import { AUTH_REPOSITORY } from '../../../domain/repositories/auth.repository';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { NutritionProfile, TrainingProfile, agentDisplayName, profileTypeLabel } from '../../../domain/entities';
import { TokenStorage } from '../../../infrastructure/auth/token-storage';
import { jwtRoles } from '../../core/jwt.util';

const GOAL_LABELS: Record<string, string> = {
  LOSE_WEIGHT: 'Perder peso',
  MAINTAIN_WEIGHT: 'Manter peso',
  GAIN_MASS: 'Ganhar massa',
};

const DIET_LABELS: Record<string, string> = {
  OMNIVORE: 'Onívoro',
  VEGETARIAN: 'Vegetariano',
  VEGAN: 'Vegano',
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    RouterLink,
    NutriButtonComponent,
    NutriInputComponent,
    NutriInfoTipComponent,
  ],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Perfil</h1>
        <p>Suas informações, metas e configurações da conta.</p>
      </div>

      @if (auth.user()) {
        <section class="portal-section">
          <div class="portal-card">
            <h3 class="portal-card__title">Conta</h3>
            <p><strong>Nome:</strong> {{ auth.user()!.name }}</p>
            <p><strong>E-mail:</strong> {{ auth.user()!.email }}</p>
          </div>
        </section>

        @if (profile()) {
          <section class="portal-section">
            <h2 class="portal-section__title">Resumo nutricional</h2>
            <nutri-info-tip
              message="Assistente, dieta e modo atleta influenciam o plano gerado pela IA. Edite pelo onboarding completo."
            />
            <div class="portal-card portal-card--highlight">
              <span class="portal-badge">{{ typeLabel() }}</span>
              <div class="macro-grid" style="margin-top: 1rem">
                <div class="macro-card">
                  <strong>{{ agentName() }}</strong><span>Assistente</span>
                </div>
                <div class="macro-card">
                  <strong>{{ profile()!.targetCalories | number:'1.0-0' }}</strong><span>kcal/dia</span>
                </div>
                <div class="macro-card">
                  <strong>{{ goalLabel() }}</strong><span>Objetivo</span>
                </div>
                <div class="macro-card">
                  <strong>{{ dietLabel() }}</strong><span>Dieta</span>
                </div>
              </div>
              <p style="margin-top: 1rem">
                <strong>Peso:</strong> {{ profile()!.currentWeightKg }} kg → meta {{ profile()!.targetWeightKg }} kg
              </p>
              @if (profile()!.athleteModeEnabled && profile()!.trainingDailyExtraKcal) {
                <p>
                  <strong>Modo atleta:</strong>
                  +{{ profile()!.trainingDailyExtraKcal | number:'1.0-0' }} kcal/dia de treino
                  @if (training()?.appliedToPlan) {
                    <span style="color: var(--nutri-brand)"> · aplicado ao plano</span>
                  }
                </p>
              }
              @if (profile()!.foodBudgetLevel) {
                <p><strong>Orçamento:</strong> {{ profile()!.foodBudgetLevel }}</p>
              }
              <div class="portal-actions" style="margin-top: 1rem; padding-top: 1rem">
                <nutri-button variant="secondary" routerLink="/onboarding">Editar onboarding</nutri-button>
                <nutri-button variant="secondary" routerLink="/app/treino">Modo atleta</nutri-button>
                <nutri-button variant="secondary" routerLink="/app/nutricionistas">Buscar nutricionista</nutri-button>
                @if (isNutritionist()) {
                  <nutri-button variant="primary" routerLink="/pro/dashboard">Portal Pro</nutri-button>
                }
              </div>
            </div>
          </section>
        }

        <section class="portal-section">
          <h2 class="portal-section__title">Editar nome</h2>
          <div class="portal-card">
            <nutri-input label="Nome" [(ngModel)]="name" name="name" />
            <div class="portal-actions" style="margin-top: 0; padding-top: 0; border: none">
              <nutri-button variant="primary" size="sm" [disabled]="savingName" (click)="saveName()">
                {{ savingName ? 'Salvando...' : 'Salvar nome' }}
              </nutri-button>
            </div>
          </div>
        </section>

        <section class="portal-section">
          <h2 class="portal-section__title">Alterar senha</h2>
          <div class="portal-card">
            <nutri-input label="Senha atual" type="password" [(ngModel)]="currentPassword" name="cur" />
            <nutri-input label="Nova senha" type="password" [(ngModel)]="newPassword" name="new" />
            <div class="portal-actions" style="margin-top: 0; padding-top: 0; border: none">
              <nutri-button variant="primary" size="sm" [disabled]="changingPassword" (click)="changePassword()">
                {{ changingPassword ? 'Alterando...' : 'Alterar senha' }}
              </nutri-button>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styleUrl: '../portal.scss',
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  private readonly authRepo = inject(AUTH_REPOSITORY);
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly tokens = inject(TokenStorage);
  private readonly router = inject(Router);

  readonly profile = signal<NutritionProfile | null>(null);
  readonly training = signal<TrainingProfile | null>(null);
  name = this.auth.user()?.name ?? '';
  currentPassword = '';
  newPassword = '';
  savingName = false;
  changingPassword = false;

  constructor() {
    void this.loadProfile();
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (e.urlAfterRedirects.includes('/app/perfil')) {
          void this.loadProfile();
        }
      });
  }

  typeLabel(): string {
    const p = this.profile();
    return p ? profileTypeLabel(p) : 'Perfil normal';
  }

  agentName(): string {
    return this.profile() ? agentDisplayName(this.profile()!.agentPersona) : 'Luna';
  }

  goalLabel(): string {
    const g = this.profile()?.goal ?? '';
    return GOAL_LABELS[g] ?? g;
  }

  dietLabel(): string {
    const d = this.profile()?.dietaryPreference ?? '';
    return DIET_LABELS[d] ?? d;
  }

  isNutritionist(): boolean {
    return jwtRoles(this.tokens.getAccessToken()).includes('NUTRITIONIST');
  }

  async loadProfile(): Promise<void> {
    try {
      this.profile.set(await this.nutritionRepo.getNutritionProfile());
      if (this.profile()?.athleteModeEnabled) {
        try {
          this.training.set(await this.nutritionRepo.getTrainingProfile());
        } catch {
          this.training.set(null);
        }
      } else {
        this.training.set(null);
      }
    } catch {
      // ignore
    }
  }

  async saveName(): Promise<void> {
    this.savingName = true;
    try {
      await this.authRepo.updateProfile({ name: this.name });
      await this.auth.refreshUser();
    } finally {
      this.savingName = false;
    }
  }

  async changePassword(): Promise<void> {
    this.changingPassword = true;
    try {
      await this.authRepo.changePassword(this.currentPassword, this.newPassword);
      this.currentPassword = '';
      this.newPassword = '';
    } finally {
      this.changingPassword = false;
    }
  }
}

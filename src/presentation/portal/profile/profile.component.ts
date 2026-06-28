import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriAvatarComponent } from '../../../design-system/nutri-avatar/nutri-avatar.component';
import { NutriStatCardComponent } from '../../../design-system/nutri-stat-card/nutri-stat-card.component';
import { NutriSectionComponent } from '../../../design-system/nutri-section/nutri-section.component';
import { NutriBadgeComponent } from '../../../design-system/nutri-badge/nutri-badge.component';
import { AuthFacade } from '../../core/auth.facade';
import { AUTH_REPOSITORY } from '../../../domain/repositories/auth.repository';
import { CARE_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { PortalDataStore } from '../../core/portal-data.store';
import {
  agentDisplayName,
  CareRelationship,
  lifeStageLabel,
  profileTypeLabel,
} from '../../../domain/entities';
import { TokenStorage } from '../../../infrastructure/auth/token-storage';
import { jwtRoles } from '../../core/jwt.util';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';
import { mealRoutineSummary } from '../../core/meal-routine';
import { MealPlanGenerationFacade } from '../../core/meal-plan-generation.facade';
import { ProfileEditService } from './profile-edit.service';

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

const RESTRICTION_LABELS: Record<string, string> = {
  NONE: 'Nenhuma',
  LACTOSE: 'Sem lactose',
  GLUTEN: 'Sem glúten',
  LACTOSE_GLUTEN: 'Sem lactose e glúten',
};

const BUDGET_LABELS: Record<string, string> = {
  ECONOMIC: 'Econômico',
  MODERATE: 'Moderado',
  FLEXIBLE: 'Flexível',
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    DatePipe,
    NutriButtonComponent,
    NutriInputComponent,
    NutriAvatarComponent,
    NutriStatCardComponent,
    NutriSectionComponent,
    NutriBadgeComponent,
  ],
  template: `
    <div class="portal-page">
      @if (profileEdit.regeneratePrompt(); as prompt) {
        <div class="profile-dialog-backdrop" (click)="closeRegenerateDialog()">
          <div class="profile-dialog" role="dialog" (click)="$event.stopPropagation()">
            <h3>Perfil atualizado</h3>
            <p>{{ prompt.messages.join(' ') }} Deseja gerar um novo plano alimentar agora?</p>
            <div class="portal-actions" style="margin-top: 1rem; padding-top: 0; border: none">
              <nutri-button variant="ghost" (click)="closeRegenerateDialog()">Depois</nutri-button>
              <nutri-button
                variant="primary"
                [disabled]="generation.phase() === 'generating'"
                (click)="generatePlan()"
              >
                {{ generation.phase() === 'generating' ? 'Gerando...' : 'Gerar plano agora' }}
              </nutri-button>
            </div>
          </div>
        </div>
      }

      @if (auth.user(); as user) {
        <div class="profile-hero portal-card portal-card--highlight">
          <div class="profile-hero__main">
            <nutri-avatar
              [name]="user.name"
              [photoUrl]="user.photoThumbnailUrl"
              size="lg"
            />
            <div>
              <h1 class="profile-hero__name">{{ user.name }}</h1>
              <p class="profile-hero__meta">{{ user.email }}</p>
              @if (user.cpfMasked) {
                <p class="profile-hero__meta">CPF: {{ user.cpfMasked }}</p>
              }
              @if (profile()) {
                <nutri-badge [variant]="profile()!.athleteModeEnabled ? 'active' : 'verified'">
                  {{ typeLabel() }}
                </nutri-badge>
              }
            </div>
          </div>
          <div class="portal-actions profile-hero__actions">
            <nutri-button variant="secondary" to="/app/perfil/editar/preferencias">Editar preferências</nutri-button>
            <nutri-button variant="secondary" to="/app/perfil/editar/metricas">Editar dados pessoais</nutri-button>
            <nutri-button variant="secondary" to="/app/perfil/editar/saude">Editar dieta e saúde</nutri-button>
            <nutri-button variant="secondary" to="/app/treino">Modo atleta</nutri-button>
            <nutri-button variant="secondary" to="/app/nutricionistas">Buscar nutricionista</nutri-button>
            @if (isNutritionist()) {
              <nutri-button variant="primary" to="/pro/dashboard">Portal Pro</nutri-button>
            }
          </div>
        </div>

        @if (profile(); as p) {
          <nutri-section title="Metas e macros" description="Resumo do seu plano nutricional calculado.">
            <div class="macro-grid">
              <nutri-stat-card [value]="agentName()" label="Assistente" />
              <nutri-stat-card [value]="(p.targetCalories | number:'1.0-0') + ' kcal'" label="Meta calórica" />
              <nutri-stat-card [value]="(p.targetProteinG | number:'1.0-0') + 'g'" label="Proteína" />
              <nutri-stat-card [value]="(p.targetCarbsG | number:'1.0-0') + 'g'" label="Carboidratos" />
              <nutri-stat-card [value]="(p.targetFatG | number:'1.0-0') + 'g'" label="Gorduras" />
              <nutri-stat-card [value]="goalLabel()" label="Objetivo" />
            </div>
          </nutri-section>

          <nutri-section
            title="Preferências alimentares"
            description="Gostos, aversões e rotina usados pela IA no plano."
          >
            <nutri-button sectionAction variant="secondary" size="sm" to="/app/perfil/editar/preferencias">
              Editar preferências
            </nutri-button>
            <div class="portal-card">
              <div class="profile-detail-grid">
                <p><strong>Orçamento:</strong> {{ budgetLabel() }}</p>
                <p><strong>Rotina:</strong> {{ mealRoutineLabel() }}</p>
                @if (p.foodLikes) {
                  <p class="profile-detail-grid__full"><strong>Gosta de:</strong> {{ p.foodLikes }}</p>
                } @else {
                  <p class="profile-detail-grid__full"><strong>Gosta de:</strong> <span class="profile-muted">Não informado</span></p>
                }
                @if (p.foodDislikes) {
                  <p class="profile-detail-grid__full"><strong>Evita:</strong> {{ p.foodDislikes }}</p>
                } @else {
                  <p class="profile-detail-grid__full"><strong>Evita:</strong> <span class="profile-muted">Não informado</span></p>
                }
                @if (p.mealNotes) {
                  <p class="profile-detail-grid__full"><strong>Observações:</strong> {{ p.mealNotes }}</p>
                }
              </div>
            </div>
          </nutri-section>

          <nutri-section title="Dados demográficos" description="Informações usadas nos cálculos metabólicos.">
            <nutri-button sectionAction variant="secondary" size="sm" to="/app/perfil/editar/metricas">
              Editar dados pessoais
            </nutri-button>
            <div class="portal-card">
              <div class="profile-detail-grid">
                @if (p.birthDate) {
                  <p><strong>Nascimento:</strong> {{ p.birthDate | date:'dd/MM/yyyy' }}</p>
                }
                <p><strong>Idade:</strong> {{ p.age }} anos</p>
                <p><strong>Sexo:</strong> {{ p.sex === 'MALE' ? 'Masculino' : 'Feminino' }}</p>
                <p><strong>Altura:</strong> {{ p.heightCm }} cm</p>
                <p><strong>Peso atual:</strong> {{ p.currentWeightKg }} kg</p>
                <p><strong>Peso meta:</strong> {{ p.targetWeightKg }} kg</p>
                @if (p.city || p.stateCode) {
                  <p><strong>Local:</strong> {{ p.city }}{{ p.city && p.stateCode ? ' — ' : '' }}{{ p.stateCode }}</p>
                }
                @if (p.lifeStage) {
                  <p><strong>Faixa etária:</strong> {{ lifeStageLabel(p.lifeStage) }}</p>
                }
                @if (p.athleteModeEnabled && p.trainingDailyExtraKcal) {
                  <p>
                    <strong>Modo atleta:</strong>
                    +{{ p.trainingDailyExtraKcal | number:'1.0-0' }} kcal/dia
                    @if (training()?.appliedToPlan) {
                      <span class="profile-inline-ok"> · aplicado ao plano</span>
                    }
                  </p>
                }
              </div>
            </div>
          </nutri-section>

          <nutri-section title="Dieta e saúde" description="Informações compartilhadas com a IA e seu nutricionista.">
            <nutri-button sectionAction variant="secondary" size="sm" to="/app/perfil/editar/saude">
              Editar dieta e saúde
            </nutri-button>
            <div class="portal-card">
              <div class="profile-detail-grid">
                <p><strong>Dieta:</strong> {{ dietLabel() }}</p>
                <p><strong>Restrição:</strong> {{ restrictionLabel() }}</p>
                @if (p.wakeTime || p.sleepTime) {
                  <p>
                    <strong>Sono:</strong>
                    acorda {{ p.wakeTime || '—' }} · dorme {{ p.sleepTime || '—' }}
                  </p>
                }
                @if (p.healthConditions) {
                  <p class="profile-detail-grid__full"><strong>Condições:</strong> {{ p.healthConditions }}</p>
                }
                @if (p.allergies) {
                  <p class="profile-detail-grid__full"><strong>Alergias:</strong> {{ p.allergies }}</p>
                }
                @if (p.medications) {
                  <p class="profile-detail-grid__full"><strong>Medicamentos:</strong> {{ p.medications }}</p>
                }
                @if (p.healthNotes) {
                  <p class="profile-detail-grid__full"><strong>Observações:</strong> {{ p.healthNotes }}</p>
                }
              </div>
            </div>
          </nutri-section>
        }

        <nutri-section
          title="Acompanhamento nutricional"
          description="Relacionamentos ativos com nutricionistas."
        >
          @if (careLoading()) {
            <p class="loading-text">Carregando acompanhamentos...</p>
          } @else if (careRelationships().length === 0) {
            <div class="portal-card">
              <p>Você ainda não tem acompanhamento humano ativo.</p>
              <div class="portal-actions" style="margin-top: 1rem; padding-top: 0; border: none">
                <nutri-button variant="primary" to="/app/nutricionistas">Buscar nutricionista</nutri-button>
              </div>
            </div>
          } @else {
            <div class="portal-list">
              @for (care of careRelationships(); track care.id) {
                <div class="portal-list-item">
                  <div class="portal-list-item__main">
                    <strong>{{ care.nutritionistName }}</strong>
                    <span>{{ care.status }} · desde {{ care.startedAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="portal-list-item__aside">
                    @if (care.status === 'ACTIVE' && !ratedCareIds().has(care.id)) {
                      <div class="profile-rate">
                        <select class="nutri-select nutri-select--sm" [(ngModel)]="ratingStars[care.id]" [name]="'stars-' + care.id">
                          @for (s of [5,4,3,2,1]; track s) {
                            <option [value]="s">{{ s }} estrelas</option>
                          }
                        </select>
                        <nutri-button
                          variant="secondary"
                          size="sm"
                          [disabled]="ratingCareId === care.id"
                          (click)="rateCare(care)"
                        >
                          Avaliar
                        </nutri-button>
                      </div>
                    } @else if (ratedCareIds().has(care.id)) {
                      <nutri-badge variant="verified">Avaliado</nutri-badge>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </nutri-section>

        <nutri-section title="Conta">
          <div class="portal-card">
            <nutri-input label="Nome" [(ngModel)]="name" name="name" />
            <div class="portal-actions" style="margin-top: 0; padding-top: 0; border: none">
              <nutri-button variant="primary" size="sm" [disabled]="savingName" (click)="saveName()">
                {{ savingName ? 'Salvando...' : 'Salvar nome' }}
              </nutri-button>
            </div>
          </div>
        </nutri-section>

        <nutri-section title="Alterar senha">
          <div class="portal-card">
            <nutri-input label="Senha atual" type="password" [(ngModel)]="currentPassword" name="cur" />
            <nutri-input label="Nova senha" type="password" [(ngModel)]="newPassword" name="new" />
            <div class="portal-actions" style="margin-top: 0; padding-top: 0; border: none">
              <nutri-button variant="primary" size="sm" [disabled]="changingPassword" (click)="changePassword()">
                {{ changingPassword ? 'Alterando...' : 'Alterar senha' }}
              </nutri-button>
            </div>
          </div>
        </nutri-section>
      }
    </div>
  `,
  styleUrl: '../portal.scss',
  styles: `
    .profile-dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .profile-dialog {
      background: white;
      border-radius: var(--nutri-radius);
      padding: 1.5rem;
      max-width: 420px;
      width: 100%;
      box-shadow: var(--nutri-shadow);
    }
    .profile-dialog h3 {
      margin: 0 0 0.75rem;
      font-size: 1.1rem;
    }
    .profile-dialog p {
      margin: 0;
      color: var(--nutri-text-muted);
      line-height: 1.5;
    }
    .profile-muted {
      color: var(--nutri-text-muted);
    }
    .profile-detail-grid__full {
      grid-column: 1 / -1;
    }
  `,
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  readonly profileEdit = inject(ProfileEditService);
  readonly generation = inject(MealPlanGenerationFacade);
  private readonly authRepo = inject(AUTH_REPOSITORY);
  private readonly careRepo = inject(CARE_REPOSITORY);
  private readonly portalData = inject(PortalDataStore);
  private readonly tokens = inject(TokenStorage);
  private readonly toast = inject(NutriToastService);

  readonly profile = this.portalData.nutritionProfile;
  readonly training = this.portalData.trainingProfile;
  readonly careRelationships = signal<CareRelationship[]>([]);
  readonly careLoading = signal(true);
  readonly ratedCareIds = signal(new Set<number>());
  ratingStars: Record<number, number> = {};
  ratingCareId: number | null = null;

  name = this.auth.user()?.name ?? '';
  currentPassword = '';
  newPassword = '';
  savingName = false;
  changingPassword = false;

  readonly lifeStageLabel = lifeStageLabel;

  async ngOnInit(): Promise<void> {
    this.name = this.auth.user()?.name ?? '';
    await this.loadProfile();
    await this.loadCare();
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

  restrictionLabel(): string {
    const r = this.profile()?.restriction ?? 'NONE';
    return RESTRICTION_LABELS[r] ?? r;
  }

  budgetLabel(): string {
    const b = this.profile()?.foodBudgetLevel ?? 'MODERATE';
    return BUDGET_LABELS[b] ?? b;
  }

  mealRoutineLabel(): string {
    const p = this.profile();
    if (!p) return '—';
    return mealRoutineSummary({
      eatsBreakfast: p.eatsBreakfast ?? true,
      eatsLunch: p.eatsLunch ?? true,
      eatsAfternoonSnack: p.eatsAfternoonSnack ?? false,
      eatsDinner: p.eatsDinner ?? true,
      openToRoutineAdjustment: p.openToRoutineAdjustment ?? false,
      freeExtras: p.freeExtras ?? [],
    });
  }

  closeRegenerateDialog(): void {
    this.profileEdit.clearRegeneratePrompt();
  }

  async generatePlan(): Promise<void> {
    this.profileEdit.clearRegeneratePrompt();
    await this.generation.generate('profile');
  }

  isNutritionist(): boolean {
    return jwtRoles(this.tokens.getAccessToken()).includes('NUTRITIONIST');
  }

  async loadProfile(): Promise<void> {
    await this.portalData.loadNutritionProfile();
    const p = this.portalData.nutritionProfile();
    if (p?.athleteModeEnabled) {
      await this.portalData.loadTrainingProfile();
    }
  }

  async loadCare(): Promise<void> {
    this.careLoading.set(true);
    try {
      const care = await this.careRepo.getMyCare();
      this.careRelationships.set(care);
      for (const c of care) {
        this.ratingStars[c.id] = 5;
      }
    } catch {
      this.careRelationships.set([]);
    } finally {
      this.careLoading.set(false);
    }
  }

  async rateCare(care: CareRelationship): Promise<void> {
    this.ratingCareId = care.id;
    const stars = this.ratingStars[care.id] ?? 5;
    await withActionFeedback(
      this.toast,
      async () => {
        await this.careRepo.rateCare(care.id, stars);
        this.ratedCareIds.update((set) => new Set(set).add(care.id));
      },
      { success: 'Avaliação enviada. Obrigado!' },
    );
    this.ratingCareId = null;
  }

  async saveName(): Promise<void> {
    this.savingName = true;
    await withActionFeedback(
      this.toast,
      async () => {
        await this.authRepo.updateProfile({ name: this.name });
        await this.auth.refreshUser();
      },
      { success: 'Nome atualizado' },
    );
    this.savingName = false;
  }

  async changePassword(): Promise<void> {
    this.changingPassword = true;
    const ok = await withActionFeedback(
      this.toast,
      async () => {
        await this.authRepo.changePassword(this.currentPassword, this.newPassword);
        this.currentPassword = '';
        this.newPassword = '';
      },
      { success: 'Senha alterada' },
    );
    this.changingPassword = false;
    if (!ok) return;
  }
}

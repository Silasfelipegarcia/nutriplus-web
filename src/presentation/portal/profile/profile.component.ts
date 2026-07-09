import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
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
  NutritionProfile,
  profileTypeLabel,
} from '../../../domain/entities';
import { formatWaterTargetMl, waterTargetRenalMessage } from '../../core/hydration';
import { TokenStorage } from '../../../infrastructure/auth/token-storage';
import { jwtRoles } from '../../core/jwt.util';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';
import { mealRoutineSummary } from '../../core/meal-routine';
import { MealPlanGenerationFacade } from '../../core/meal-plan-generation.facade';
import { ProfileEditService } from './profile-edit.service';
import { fileToPhotoDataUrl, pickImageFile, PhotoPickerError } from '../../core/photo-picker.util';
import { PlanResetEntryComponent } from '../plan-reset/plan-reset-entry.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { PlanRegenerationEligibility } from '../../../domain/entities';

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
    PlanResetEntryComponent,
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
            <div class="profile-hero__avatar-wrap">
              <nutri-avatar
                [name]="user.name"
                [photoUrl]="displayPhotoUrl()"
                size="lg"
                [uploadable]="true"
                [uploadBusy]="savingPhoto"
                [uploadDisabled]="savingPhoto"
                (uploadClick)="changePhoto()"
              />
            </div>
            <div class="profile-hero__identity">
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
              @if (waterTargetLabel(p)) {
                <nutri-stat-card [value]="waterTargetLabel(p)!" label="Água (meta)" />
              }
              <nutri-stat-card [value]="goalLabel()" label="Objetivo" />
            </div>
          </nutri-section>

          <nutri-section
            title="Plano alimentar"
            description="Descarte o plano atual e gere outro do zero, com confirmação explícita."
          >
            <app-plan-reset-entry
              [eligibility]="regenerationEligibility()"
              source="profile"
              buttonVariant="secondary"
              buttonSize="sm"
            />
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

        <nutri-section
          title="Minha conta"
          description="Foto, nome e dados de acesso da sua conta Nutri+."
        >
          <div class="portal-card profile-account-card">
            <div class="profile-account-card__header">
              <nutri-avatar
                [name]="name || user.name"
                [photoUrl]="displayPhotoUrl()"
                size="lg"
                [uploadable]="true"
                [uploadBusy]="savingPhoto"
                [uploadDisabled]="savingPhoto"
                (uploadClick)="changePhoto()"
              />
              <div class="profile-account-card__photo-actions">
                <nutri-button
                  variant="secondary"
                  size="sm"
                  [disabled]="savingPhoto"
                  (click)="changePhoto()"
                >
                  {{ savingPhoto ? 'Enviando foto...' : 'Alterar foto' }}
                </nutri-button>
                @if (hasPhoto()) {
                  <nutri-button
                    variant="ghost"
                    size="sm"
                    [disabled]="savingPhoto || removingPhoto"
                    (click)="removePhoto()"
                  >
                    {{ removingPhoto ? 'Removendo...' : 'Remover foto' }}
                  </nutri-button>
                }
                <p class="profile-account-card__hint">JPEG, PNG ou WebP. Máximo 2 MB.</p>
              </div>
            </div>

            <form class="form-grid form-grid--full profile-account-card__form" (ngSubmit)="saveAccount()">
              <nutri-input label="Nome completo" [(ngModel)]="name" name="name" required />
              <nutri-input label="E-mail" [ngModel]="user.email" name="email" [disabled]="true" />
              @if (user.cpfMasked) {
                <nutri-input label="CPF" [ngModel]="user.cpfMasked" name="cpf" [disabled]="true" />
              }
              <div class="profile-account-card__actions">
                <nutri-button
                  variant="primary"
                  type="submit"
                  [disabled]="savingAccount || !name.trim()"
                >
                  {{ savingAccount ? 'Salvando...' : 'Salvar alterações' }}
                </nutri-button>
              </div>
            </form>
          </div>
        </nutri-section>

        <nutri-section title="Segurança" description="Mantenha sua conta protegida com uma senha forte.">
          <div class="portal-card">
            <form class="form-grid form-grid--full" (ngSubmit)="changePassword()">
              <nutri-input
                label="Senha atual"
                type="password"
                [(ngModel)]="currentPassword"
                name="cur"
                autocomplete="current-password"
              />
              <nutri-input
                label="Nova senha"
                type="password"
                [(ngModel)]="newPassword"
                name="new"
                autocomplete="new-password"
              />
              <nutri-input
                label="Confirmar nova senha"
                type="password"
                [(ngModel)]="confirmPassword"
                name="confirm"
                autocomplete="new-password"
              />
              <div class="profile-account-card__actions">
                <nutri-button
                  variant="primary"
                  type="submit"
                  [disabled]="changingPassword || !canChangePassword()"
                >
                  {{ changingPassword ? 'Alterando...' : 'Alterar senha' }}
                </nutri-button>
              </div>
            </form>
          </div>
        </nutri-section>

        <nutri-section
          title="Zona de perigo"
          description="Encerrar uso da conta. Disponível apenas neste portal web."
        >
          <section class="portal-danger-zone">
            <h3 class="portal-danger-zone__title">Encerrar minha conta</h3>
            <p class="portal-danger-zone__text">
              Recomendamos <strong>congelar</strong> a conta: seus dados ficam guardados e você pode voltar quando
              quiser. A exclusão permanente só faz sentido se tiver certeza de que não vai retornar — após 90 dias
              congelada, removemos os dados automaticamente.
            </p>
            <button type="button" class="portal-danger-zone__link" (click)="abrirEncerramentoConta()">
              Quero encerrar minha conta
            </button>
          </section>
        </nutri-section>
      }
    </div>

    @if (mostrarEncerramentoConta()) {
      <div class="portal-confirm-overlay" (click)="fecharEncerramentoConta()" role="presentation">
        <div
          class="portal-confirm-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="close-account-title"
          (click)="$event.stopPropagation()"
        >
          <header class="portal-confirm-sheet__header">
            <h2 id="close-account-title">Como deseja encerrar?</h2>
            <button type="button" class="portal-confirm-sheet__close" (click)="fecharEncerramentoConta()" aria-label="Fechar">
              ×
            </button>
          </header>

          <p class="portal-confirm-sheet__lead">
            A opção mais segura é <strong>congelar</strong>: você perde o acesso agora, mas mantém planos, histórico e
            evolução salvos para reativar depois com e-mail e senha.
          </p>

          <ul class="portal-confirm-sheet__list">
            <li>Congelar desativa login e renovação automática da assinatura.</li>
            <li>Você pode reativar a qualquer momento na tela de login.</li>
            <li>Contas congeladas há mais de 90 dias são excluídas permanentemente.</li>
          </ul>

          <div class="portal-confirm-sheet__actions">
            <nutri-button variant="primary" [block]="true" (click)="abrirCongelamentoConta()">
              Congelar minha conta (recomendado)
            </nutri-button>
            <nutri-button variant="outline" [block]="true" (click)="abrirExclusaoConta()">
              Excluir permanentemente agora
            </nutri-button>
            <nutri-button variant="ghost" [block]="true" (click)="fecharEncerramentoConta()">
              Manter minha conta
            </nutri-button>
          </div>
        </div>
      </div>
    }

    @if (mostrarCongelamentoConta()) {
      <div class="portal-confirm-overlay" (click)="fecharCongelamentoConta()" role="presentation">
        <div
          class="portal-confirm-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="freeze-account-title"
          (click)="$event.stopPropagation()"
        >
          <header class="portal-confirm-sheet__header">
            <h2 id="freeze-account-title">Congelar conta?</h2>
            <button type="button" class="portal-confirm-sheet__close" (click)="fecharCongelamentoConta()" aria-label="Fechar">
              ×
            </button>
          </header>

          <p class="portal-confirm-sheet__lead">
            Você sairá do Nutri+ agora, mas seus dados permanecem guardados para quando quiser voltar.
          </p>

          <label class="portal-confirm-sheet__confirm">
            <input
              type="checkbox"
              [checked]="confirmarCongelamentoChecked()"
              (change)="confirmarCongelamentoChecked.set($any($event.target).checked)"
            />
            <span>Entendo que perderei o acesso até reativar a conta</span>
          </label>

          <label class="portal-confirm-sheet__field">
            <span>Digite <strong>{{ auth.user()?.email }}</strong> para confirmar</span>
            <input
              type="email"
              [value]="confirmarCongelamentoEmail()"
              (input)="confirmarCongelamentoEmail.set($any($event.target).value)"
              autocomplete="off"
              spellcheck="false"
              [attr.placeholder]="auth.user()?.email ?? ''"
            />
          </label>

          <nutri-input
            label="Senha atual"
            type="password"
            [(ngModel)]="congelamentoSenhaAtual"
            name="freezeAccountPassword"
            autocomplete="current-password"
          />

          <div class="portal-confirm-sheet__actions">
            <nutri-button variant="primary" [block]="true" [disabled]="congelandoConta()" (click)="fecharCongelamentoConta()">
              Manter minha conta
            </nutri-button>
            <nutri-button
              variant="outline"
              [block]="true"
              [disabled]="!podeConfirmarCongelamentoConta() || congelandoConta()"
              (click)="confirmarCongelamentoConta()"
            >
              @if (congelandoConta()) { Congelando... }
              @else { Sim, congelar conta }
            </nutri-button>
          </div>
        </div>
      </div>
    }

    @if (mostrarExclusaoConta()) {
      <div class="portal-confirm-overlay" (click)="fecharExclusaoConta()" role="presentation">
        <div
          class="portal-confirm-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          (click)="$event.stopPropagation()"
        >
          <header class="portal-confirm-sheet__header">
            <h2 id="delete-account-title">Excluir conta permanentemente?</h2>
            <button type="button" class="portal-confirm-sheet__close" (click)="fecharExclusaoConta()" aria-label="Fechar">
              ×
            </button>
          </header>

          <p class="portal-confirm-sheet__lead">
            Você perderá o acesso imediato e seus dados pessoais serão removidos do Nutri+ agora. Prefere voltar depois?
            <button type="button" class="portal-danger-zone__link" (click)="voltarParaCongelamento()">
              Congele a conta em vez de excluir
            </button>
          </p>

          <ul class="portal-confirm-sheet__list">
            <li>Planos alimentares, check-ins e medições serão apagados.</li>
            <li>Renovação automática da assinatura será desativada antes da exclusão.</li>
            <li>Esta ação só pode ser feita pelo portal web, não pelo app mobile.</li>
          </ul>

          <label class="portal-confirm-sheet__confirm">
            <input
              type="checkbox"
              [checked]="confirmarExclusaoChecked()"
              (change)="confirmarExclusaoChecked.set($any($event.target).checked)"
            />
            <span>Entendo que esta ação é irreversível e meus dados serão excluídos</span>
          </label>

          <label class="portal-confirm-sheet__field">
            <span>Digite <strong>{{ auth.user()?.email }}</strong> para confirmar</span>
            <input
              type="email"
              [value]="confirmarExclusaoEmail()"
              (input)="confirmarExclusaoEmail.set($any($event.target).value)"
              autocomplete="off"
              spellcheck="false"
              [attr.placeholder]="auth.user()?.email ?? ''"
            />
          </label>

          <nutri-input
            label="Senha atual"
            type="password"
            [(ngModel)]="exclusaoSenhaAtual"
            name="deleteAccountPassword"
            autocomplete="current-password"
          />

          <div class="portal-confirm-sheet__actions">
            <nutri-button variant="primary" [block]="true" [disabled]="excluindoConta()" (click)="fecharExclusaoConta()">
              Manter minha conta
            </nutri-button>
            <nutri-button
              variant="outline"
              [block]="true"
              [disabled]="!podeConfirmarExclusaoConta() || excluindoConta()"
              (click)="confirmarExclusaoConta()"
            >
              @if (excluindoConta()) { Excluindo... }
              @else { Sim, excluir minha conta }
            </nutri-button>
          </div>
        </div>
      </div>
    }
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
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly authRepo = inject(AUTH_REPOSITORY);
  private readonly careRepo = inject(CARE_REPOSITORY);
  private readonly portalData = inject(PortalDataStore);
  private readonly tokens = inject(TokenStorage);
  private readonly toast = inject(NutriToastService);
  private readonly router = inject(Router);

  readonly profile = this.portalData.nutritionProfile;
  readonly training = this.portalData.trainingProfile;
  readonly regenerationEligibility = signal<PlanRegenerationEligibility | null>(null);
  readonly careRelationships = signal<CareRelationship[]>([]);
  readonly careLoading = signal(true);
  readonly ratedCareIds = signal(new Set<number>());
  ratingStars: Record<number, number> = {};
  ratingCareId: number | null = null;

  name = this.auth.user()?.name ?? '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  savingAccount = false;
  savingPhoto = false;
  removingPhoto = false;
  changingPassword = false;
  readonly mostrarEncerramentoConta = signal(false);
  readonly mostrarCongelamentoConta = signal(false);
  readonly mostrarExclusaoConta = signal(false);
  readonly confirmarCongelamentoChecked = signal(false);
  readonly confirmarCongelamentoEmail = signal('');
  congelamentoSenhaAtual = '';
  congelandoConta = signal(false);
  readonly confirmarExclusaoChecked = signal(false);
  readonly confirmarExclusaoEmail = signal('');
  exclusaoSenhaAtual = '';
  excluindoConta = signal(false);
  private readonly photoPreview = signal<string | null>(null);

  readonly displayPhotoUrl = computed(() => {
    const preview = this.photoPreview();
    if (preview) return preview;
    return this.auth.user()?.photoThumbnailUrl;
  });

  readonly hasPhoto = computed(() => Boolean(this.displayPhotoUrl()));

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

  waterTargetLabel(profile: NutritionProfile): string | null {
    if (profile.severeRenalRestriction) {
      return waterTargetRenalMessage;
    }
    const label = formatWaterTargetMl(profile.dailyWaterTargetMl);
    return label || null;
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
    try {
      this.regenerationEligibility.set(await this.nutritionRepo.getPlanRegenerationEligibility());
    } catch {
      this.regenerationEligibility.set(null);
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

  async changePhoto(): Promise<void> {
    if (this.savingPhoto) return;

    const file = await pickImageFile();
    if (!file) return;

    this.savingPhoto = true;
    try {
      const dataUrl = await fileToPhotoDataUrl(file);
      this.photoPreview.set(dataUrl);
      await withActionFeedback(
        this.toast,
        async () => {
          await this.authRepo.updateProfile({ photoUrl: dataUrl });
          await this.auth.refreshUser();
          this.photoPreview.set(null);
        },
        { success: 'Foto atualizada' },
      );
    } catch (e) {
      this.photoPreview.set(null);
      const message = e instanceof PhotoPickerError ? e.message : 'Não foi possível enviar a foto.';
      this.toast.error(message);
    } finally {
      this.savingPhoto = false;
    }
  }

  async removePhoto(): Promise<void> {
    if (this.removingPhoto || this.savingPhoto) return;

    this.removingPhoto = true;
    await withActionFeedback(
      this.toast,
      async () => {
        await this.authRepo.updateProfile({ photoUrl: '' });
        await this.auth.refreshUser();
        this.photoPreview.set(null);
      },
      { success: 'Foto removida' },
    );
    this.removingPhoto = false;
  }

  async saveAccount(): Promise<void> {
    const trimmed = this.name.trim();
    if (!trimmed) return;

    this.savingAccount = true;
    await withActionFeedback(
      this.toast,
      async () => {
        await this.authRepo.updateProfile({ name: trimmed });
        await this.auth.refreshUser();
        this.name = this.auth.user()?.name ?? trimmed;
      },
      { success: 'Conta atualizada' },
    );
    this.savingAccount = false;
  }

  canChangePassword(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword
    );
  }

  async changePassword(): Promise<void> {
    if (!this.canChangePassword()) {
      if (this.newPassword && this.newPassword !== this.confirmPassword) {
        this.toast.error('A confirmação não coincide com a nova senha.');
      } else if (this.newPassword && this.newPassword.length < 8) {
        this.toast.error('A nova senha deve ter pelo menos 8 caracteres.');
      }
      return;
    }

    this.changingPassword = true;
    const ok = await withActionFeedback(
      this.toast,
      async () => {
        await this.authRepo.changePassword(this.currentPassword, this.newPassword);
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      { success: 'Senha alterada' },
    );
    this.changingPassword = false;
    if (!ok) return;
  }

  abrirEncerramentoConta(): void {
    this.mostrarEncerramentoConta.set(true);
  }

  fecharEncerramentoConta(): void {
    this.mostrarEncerramentoConta.set(false);
  }

  abrirCongelamentoConta(): void {
    this.resetCongelamentoForm();
    this.mostrarEncerramentoConta.set(false);
    this.mostrarCongelamentoConta.set(true);
  }

  fecharCongelamentoConta(): void {
    if (this.congelandoConta()) return;
    this.mostrarCongelamentoConta.set(false);
  }

  voltarParaCongelamento(): void {
    this.mostrarExclusaoConta.set(false);
    this.abrirCongelamentoConta();
  }

  podeConfirmarCongelamentoConta(): boolean {
    const email = this.auth.user()?.email?.trim().toLowerCase() ?? '';
    return (
      this.confirmarCongelamentoChecked() &&
      this.confirmarCongelamentoEmail().trim().toLowerCase() === email &&
      this.congelamentoSenhaAtual.length > 0
    );
  }

  async confirmarCongelamentoConta(): Promise<void> {
    if (!this.podeConfirmarCongelamentoConta()) return;

    this.congelandoConta.set(true);
    const ok = await withActionFeedback(
      this.toast,
      async () => {
        await this.authRepo.freezeAccount(this.congelamentoSenhaAtual, this.confirmarCongelamentoEmail().trim());
        this.generation.stopPolling();
        this.portalData.invalidate(
          'nutritionProfile',
          'checkinStats',
          'todayCheckins',
          'trainingProfile',
          'sportCatalog',
        );
        this.auth.logout();
        await this.router.navigate(['/'], {
          state: { registerMessage: 'Conta congelada. Seus dados foram preservados — reative quando quiser voltar.' },
        });
      },
      { success: 'Conta congelada' },
    );
    this.congelandoConta.set(false);
    if (ok) {
      this.mostrarCongelamentoConta.set(false);
    }
  }

  private resetCongelamentoForm(): void {
    this.confirmarCongelamentoChecked.set(false);
    this.confirmarCongelamentoEmail.set('');
    this.congelamentoSenhaAtual = '';
  }

  abrirExclusaoConta(): void {
    this.confirmarExclusaoChecked.set(false);
    this.confirmarExclusaoEmail.set('');
    this.exclusaoSenhaAtual = '';
    this.mostrarEncerramentoConta.set(false);
    this.mostrarExclusaoConta.set(true);
  }

  fecharExclusaoConta(): void {
    if (this.excluindoConta()) return;
    this.mostrarExclusaoConta.set(false);
  }

  podeConfirmarExclusaoConta(): boolean {
    const email = this.auth.user()?.email?.trim().toLowerCase() ?? '';
    return (
      this.confirmarExclusaoChecked() &&
      this.confirmarExclusaoEmail().trim().toLowerCase() === email &&
      this.exclusaoSenhaAtual.length > 0
    );
  }

  async confirmarExclusaoConta(): Promise<void> {
    if (!this.podeConfirmarExclusaoConta()) return;

    this.excluindoConta.set(true);
    const ok = await withActionFeedback(
      this.toast,
      async () => {
        await this.authRepo.deleteAccount(this.exclusaoSenhaAtual, this.confirmarExclusaoEmail().trim());
        this.generation.stopPolling();
        this.portalData.invalidate(
          'nutritionProfile',
          'checkinStats',
          'todayCheckins',
          'trainingProfile',
          'sportCatalog',
        );
        this.auth.logout();
        await this.router.navigate(['/']);
      },
      { success: 'Conta excluída com sucesso' },
    );
    this.excluindoConta.set(false);
    if (ok) {
      this.mostrarExclusaoConta.set(false);
    }
  }
}

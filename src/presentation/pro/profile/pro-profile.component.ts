import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriSectionComponent } from '../../../design-system/nutri-section/nutri-section.component';
import { NutriBadgeComponent } from '../../../design-system/nutri-badge/nutri-badge.component';
import { NutriStatCardComponent } from '../../../design-system/nutri-stat-card/nutri-stat-card.component';
import { PRO_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { NutritionistPublic, NutritionistRatingsSummary, PortfolioItemInput } from '../../../domain/entities';
import { BRAZIL_STATES } from '../../core/brazil-states';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

@Component({
  selector: 'app-pro-profile',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    NutriButtonComponent,
    NutriInputComponent,
    NutriSectionComponent,
    NutriBadgeComponent,
    NutriStatCardComponent,
  ],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Perfil Pro</h1>
        <p>Configurações do nutricionista e recebimentos.</p>
      </div>

      @if (profile()) {
        <div class="portal-card portal-card--highlight" style="margin-bottom: 1.5rem">
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap">
            <strong>CRN {{ profile()!.crn }}</strong>
            @if (profile()!.crnVerified) {
              <nutri-badge variant="verified">Verificado</nutri-badge>
            } @else {
              <nutri-badge variant="pending">Verificação pendente</nutri-badge>
            }
            @if (profile()!.ratingCount > 0) {
              <span class="profile-hero__meta">
                ★ {{ profile()!.averageRating | number:'1.1-1' }} ({{ profile()!.ratingCount }} avaliações)
              </span>
            }
          </div>
        </div>

        <nutri-section title="Perfil público">
          <div class="portal-card">
            <form class="form-grid form-grid--full" (ngSubmit)="saveProfile()">
              <nutri-input label="Bio" type="textarea" [(ngModel)]="bio" name="bio" />
              <nutri-input label="Especialidades" [(ngModel)]="specialties" name="specialties" />
              <nutri-input label="Formação" type="textarea" [(ngModel)]="formation" name="formation" placeholder="Ex.: Nutrição USP, pós esportiva" />
              <nutri-input label="Anos de experiência" type="number" [(ngModel)]="experienceYears" name="experienceYears" />
              <nutri-input label="Abordagem" type="textarea" [(ngModel)]="approach" name="approach" />
              <nutri-input label="Idiomas (códigos separados por vírgula)" [(ngModel)]="languagesText" name="languages" placeholder="PT, EN" />
              <nutri-input label="WhatsApp" [(ngModel)]="whatsappPhone" name="whatsapp" placeholder="5511999999999" />
              <div>
                <label class="field-label">Modos de atendimento</label>
                <label class="onboarding-check">
                  <input type="checkbox" [(ngModel)]="modeOnline" name="modeOnline" />
                  <span>Online</span>
                </label>
                <label class="onboarding-check">
                  <input type="checkbox" [(ngModel)]="modeInPerson" name="modeInPerson" />
                  <span>Presencial</span>
                </label>
              </div>
              <div>
                <label class="field-label">Estado</label>
                <select class="nutri-select" [(ngModel)]="stateCode" name="state">
                  <option value="">Selecione</option>
                  @for (s of states; track s.code) {
                    <option [value]="s.code">{{ s.name }}</option>
                  }
                </select>
              </div>
              <nutri-input label="Cidade" [(ngModel)]="city" name="city" />
              <label class="onboarding-check">
                <input type="checkbox" [(ngModel)]="marketplaceVisible" name="visible" />
                <span>Visível no marketplace</span>
              </label>
              <div class="portal-actions" style="margin-top: 0; padding-top: 0; border: none">
                <nutri-button variant="primary" type="submit" [disabled]="savingProfile">
                  {{ savingProfile ? 'Salvando...' : 'Salvar perfil' }}
                </nutri-button>
              </div>
            </form>
          </div>
        </nutri-section>

        <nutri-section title="Portfólio (casos em texto)" description="Até 5 casos. Exibidos no marketplace.">
          <div class="portal-card">
            @for (item of portfolioItems; track $index) {
              <div class="form-grid form-grid--full" style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--nutri-border)">
                <nutri-input label="Título do caso" [(ngModel)]="item.title" [name]="'ptitle' + $index" />
                <nutri-input label="Resumo" type="textarea" [(ngModel)]="item.summary" [name]="'psummary' + $index" />
                <nutri-button variant="ghost" size="sm" (click)="removePortfolioItem($index)">Remover</nutri-button>
              </div>
            }
            @if (portfolioItems.length < 5) {
              <nutri-button variant="secondary" (click)="addPortfolioItem()">Adicionar caso</nutri-button>
            }
            <div class="portal-actions" style="margin-top: 1rem; padding-top: 0; border: none">
              <nutri-button variant="primary" [disabled]="savingPortfolio" (click)="savePortfolio()">
                {{ savingPortfolio ? 'Salvando...' : 'Salvar portfólio' }}
              </nutri-button>
            </div>
          </div>
        </nutri-section>

        @if (profile()) {
          <nutri-section title="Preview marketplace">
            <div class="portal-card portal-card--highlight">
              <strong>{{ profile()!.name }}</strong>
              <p class="profile-hero__meta">CRN {{ profile()!.crn }}</p>
              @if (profile()!.formation) {
                <p>{{ profile()!.formation }}</p>
              }
              @if (profile()!.experienceYears) {
                <p>{{ profile()!.experienceYears }} anos de experiência</p>
              }
              @if (profile()!.approach) {
                <p><em>{{ profile()!.approach }}</em></p>
              }
              <p>{{ profile()!.bio }}</p>
            </div>
          </nutri-section>
        }

        <nutri-section title="Preços">
          <div class="portal-card">
            <form class="form-grid" (ngSubmit)="savePricing()">
              <nutri-input
                label="Consulta (centavos)"
                type="number"
                [(ngModel)]="consultationPriceCents"
                name="price"
              />
              <nutri-input
                label="Duração do acompanhamento (dias)"
                type="number"
                [(ngModel)]="careDurationDays"
                name="days"
              />
              <div class="form-grid--full portal-actions" style="margin-top: 0; padding-top: 0; border: none">
                <nutri-button variant="primary" type="submit" [disabled]="savingPricing">
                  {{ savingPricing ? 'Salvando...' : 'Salvar preços' }}
                </nutri-button>
              </div>
            </form>
          </div>
        </nutri-section>

        <nutri-section title="Stripe Connect" description="Configure recebimentos de consultas.">
          <div class="portal-card">
            @if (stripeComplete) {
              <p>Conta Stripe conectada.</p>
            } @else {
              <p>Conecte sua conta para receber pagamentos de pacientes.</p>
            }
            <div class="portal-actions" style="margin-top: 1rem; padding-top: 0; border: none">
              <nutri-button variant="secondary" [disabled]="connectingStripe" (click)="connectStripe()">
                {{ connectingStripe ? 'Abrindo...' : stripeComplete ? 'Reconfigurar Stripe' : 'Conectar Stripe' }}
              </nutri-button>
            </div>
          </div>
        </nutri-section>

        @if (ratings()) {
          <nutri-section title="Avaliações recentes">
            <div class="macro-grid">
              <nutri-stat-card [value]="formatRating(ratings()!.averageStars)" label="Média" />
              <nutri-stat-card [value]="ratings()!.totalRatings" label="Total" />
            </div>
            @if (ratings()!.recent.length) {
              <div class="portal-list">
                @for (r of ratings()!.recent; track r.id) {
                  <div class="portal-list-item">
                    <div class="portal-list-item__main">
                      <strong>{{ r.patientName }} · {{ r.stars }}★</strong>
                      <span>{{ r.comment || 'Sem comentário' }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </nutri-section>
        }
      }
    </div>
  `,
  styleUrl: '../../portal/portal.scss',
})
export class ProProfileComponent implements OnInit {
  private readonly proRepo = inject(PRO_REPOSITORY);
  private readonly toast = inject(NutriToastService);
  private readonly analytics = inject(AnalyticsService);

  readonly states = BRAZIL_STATES;
  readonly profile = signal<NutritionistPublic | null>(null);
  readonly ratings = signal<NutritionistRatingsSummary | null>(null);

  bio = '';
  specialties = '';
  formation = '';
  experienceYears: number | null = null;
  approach = '';
  languagesText = '';
  modeOnline = true;
  modeInPerson = false;
  whatsappPhone = '';
  city = '';
  stateCode = '';
  marketplaceVisible = true;
  consultationPriceCents = 0;
  careDurationDays = 30;
  stripeComplete = false;
  savingProfile = false;
  savingPricing = false;
  savingPortfolio = false;
  connectingStripe = false;
  portfolioItems: PortfolioItemInput[] = [];

  async ngOnInit(): Promise<void> {
    const [profile, ratings, portfolio] = await Promise.all([
      this.proRepo.getProfile(),
      this.proRepo.getMyRatings().catch(() => null),
      this.proRepo.getPortfolio().catch(() => []),
    ]);
    this.profile.set(profile);
    this.ratings.set(ratings);
    this.bio = profile.bio ?? '';
    this.specialties = profile.specialties ?? '';
    this.formation = profile.formation ?? '';
    this.experienceYears = profile.experienceYears ?? null;
    this.approach = profile.approach ?? '';
    this.languagesText = (profile.languages ?? []).join(', ');
    this.modeOnline = profile.serviceModes.includes('ONLINE');
    this.modeInPerson = profile.serviceModes.includes('IN_PERSON');
    this.whatsappPhone = profile.whatsappPhone ?? '';
    this.city = profile.city ?? '';
    this.stateCode = profile.stateCode ?? '';
    this.consultationPriceCents = profile.consultationPriceCents;
    this.careDurationDays = profile.careDurationDays;
    this.portfolioItems = portfolio.map((p) => ({ title: p.title, summary: p.summary }));
  }

  addPortfolioItem(): void {
    if (this.portfolioItems.length >= 5) return;
    this.portfolioItems.push({ title: '', summary: '' });
  }

  removePortfolioItem(index: number): void {
    this.portfolioItems.splice(index, 1);
  }

  private serviceModes(): string[] {
    const modes: string[] = [];
    if (this.modeOnline) modes.push('ONLINE');
    if (this.modeInPerson) modes.push('IN_PERSON');
    return modes;
  }

  private parseLanguages(): string[] {
    return this.languagesText
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length >= 2);
  }

  formatRating(value: number): string {
    return value.toFixed(1);
  }

  async saveProfile(): Promise<void> {
    this.savingProfile = true;
    await withActionFeedback(
      this.toast,
      async () => {
        const updated = await this.proRepo.updateProfile({
          bio: this.bio.trim(),
          specialties: this.specialties.trim(),
          formation: this.formation.trim() || undefined,
          experienceYears: this.experienceYears ?? undefined,
          approach: this.approach.trim() || undefined,
          languages: this.parseLanguages(),
          serviceModes: this.serviceModes(),
          whatsappPhone: this.whatsappPhone.trim() || undefined,
          city: this.city.trim() || undefined,
          stateCode: this.stateCode || undefined,
          marketplaceVisible: this.marketplaceVisible,
        });
        this.profile.set(updated);
      },
      { success: 'Perfil atualizado' },
    );
    this.savingProfile = false;
  }

  async savePortfolio(): Promise<void> {
    this.savingPortfolio = true;
    await withActionFeedback(
      this.toast,
      async () => {
        const items = this.portfolioItems
          .filter((i) => i.title.trim() && i.summary.trim())
          .map((i) => ({ title: i.title.trim(), summary: i.summary.trim() }));
        await this.proRepo.updatePortfolio(items);
        const profile = await this.proRepo.getProfile();
        this.profile.set(profile);
      },
      { success: 'Portfólio atualizado' },
    );
    this.savingPortfolio = false;
  }

  async savePricing(): Promise<void> {
    this.savingPricing = true;
    await withActionFeedback(
      this.toast,
      async () => {
        const updated = await this.proRepo.updatePricing({
          consultationPriceCents: this.consultationPriceCents,
          careDurationDays: this.careDurationDays,
        });
        this.profile.set(updated);
      },
      { success: 'Preços atualizados' },
    );
    this.savingPricing = false;
  }

  async connectStripe(): Promise<void> {
    this.analytics.trackProStripeConnectStart();
    this.connectingStripe = true;
    await withActionFeedback(
      this.toast,
      async () => {
        const result = await this.proRepo.connectStripe();
        this.stripeComplete = result.onboardingComplete;
        if (result.onboardingUrl) {
          window.open(result.onboardingUrl, '_blank', 'noopener,noreferrer');
        }
      },
      { success: 'Stripe aberto em nova aba' },
    );
    this.connectingStripe = false;
  }
}

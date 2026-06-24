import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriAvatarComponent } from '../../../design-system/nutri-avatar/nutri-avatar.component';
import { NutriBadgeComponent } from '../../../design-system/nutri-badge/nutri-badge.component';
import { NutriSectionComponent } from '../../../design-system/nutri-section/nutri-section.component';
import { CARE_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { NutritionistPublic, NutritionistRatingsSummary } from '../../../domain/entities';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';
import { parseApiError } from '../../../infrastructure/http/api-error';

@Component({
  selector: 'app-marketplace-detail',
  standalone: true,
  imports: [DecimalPipe, NutriButtonComponent, NutriAvatarComponent, NutriBadgeComponent, NutriSectionComponent],
  template: `
    <div class="portal-page">
      @if (loading()) {
        <p class="loading-text">Carregando...</p>
      } @else if (error()) {
        <div class="auth-card__error">{{ error() }}</div>
        <nutri-button variant="secondary" to="/app/nutricionistas">Voltar</nutri-button>
      } @else if (nutritionist()) {
        <div class="profile-hero portal-card portal-card--highlight">
          <div class="profile-hero__main">
            <nutri-avatar
              [name]="nutritionist()!.name"
              [photoUrl]="nutritionist()!.photoThumbnailUrl"
              size="lg"
            />
            <div>
              <h1 class="profile-hero__name">{{ nutritionist()!.name }}</h1>
              <p class="profile-hero__meta">CRN {{ nutritionist()!.crn }}</p>
              @if (nutritionist()!.crnVerified) {
                <nutri-badge variant="verified">CRN verificado</nutri-badge>
              }
              @if (nutritionist()!.ratingCount > 0) {
                <p class="profile-hero__meta">
                  ★ {{ nutritionist()!.averageRating | number:'1.1-1' }} · {{ nutritionist()!.ratingCount }} avaliações
                </p>
              }
              <p class="profile-hero__meta">
                {{ nutritionist()!.locationLabel || (nutritionist()!.city + '/' + nutritionist()!.stateCode) }}
              </p>
            </div>
          </div>
        </div>

        <nutri-section title="Sobre">
          <div class="portal-card">
            <p>{{ nutritionist()!.bio || 'Sem bio cadastrada.' }}</p>
            <p><strong>Especialidades:</strong> {{ nutritionist()!.specialties || '—' }}</p>
            <p>
              <strong>Consulta:</strong>
              R$ {{ nutritionist()!.consultationPriceCents / 100 | number:'1.2-2' }}
              · {{ nutritionist()!.careDurationDays }} dias de acompanhamento
            </p>
          </div>
        </nutri-section>

        @if (ratings()?.recent?.length) {
          <nutri-section title="Avaliações recentes">
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
          </nutri-section>
        }

        <div class="portal-actions">
          <nutri-button variant="ghost" to="/app/nutricionistas">Voltar</nutri-button>
          <nutri-button variant="primary" [disabled]="requesting()" (click)="request()">
            {{ requesting() ? 'Solicitando...' : 'Solicitar acompanhamento' }}
          </nutri-button>
        </div>
      }
    </div>
  `,
  styleUrl: '../portal.scss',
})
export class MarketplaceDetailComponent implements OnInit {
  private readonly careRepo = inject(CARE_REPOSITORY);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(NutriToastService);

  readonly nutritionist = signal<NutritionistPublic | null>(null);
  readonly ratings = signal<NutritionistRatingsSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly requesting = signal(false);

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const [nutritionist, ratings] = await Promise.all([
        this.careRepo.getNutritionist(id),
        this.careRepo.getNutritionistRatings(id).catch(() => null),
      ]);
      this.nutritionist.set(nutritionist);
      this.ratings.set(ratings);
    } catch (e) {
      this.error.set(parseApiError(e).message);
    } finally {
      this.loading.set(false);
    }
  }

  async request(): Promise<void> {
    const n = this.nutritionist();
    if (!n) return;
    this.requesting.set(true);
    await withActionFeedback(
      this.toast,
      async () => {
        await this.careRepo.requestCare(n.id);
      },
      { success: 'Solicitação enviada. Siga as instruções de pagamento quando disponíveis.' },
    );
    this.requesting.set(false);
  }
}

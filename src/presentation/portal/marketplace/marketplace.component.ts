import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriEmptyStateComponent } from '../../../design-system/nutri-empty-state/nutri-empty-state.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { CARE_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { NutritionistPublic } from '../../../domain/entities';
import { parseApiError } from '../../../infrastructure/http/api-error';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [DecimalPipe, RouterLink, NutriButtonComponent, NutriEmptyStateComponent, NutriInfoTipComponent],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Buscar nutricionista</h1>
        <p>Contrate acompanhamento humano opcional — a IA continua disponível.</p>
      </div>
      <nutri-info-tip
        message="Nutricionistas revisam seu dossiê e podem publicar planos. Você mantém Luna/Bruno para o dia a dia."
      />

      @if (loading()) {
        <p class="loading-text">Carregando nutricionistas...</p>
      } @else if (error()) {
        <div class="auth-card__error">{{ error() }}</div>
        <div class="portal-actions">
          <nutri-button variant="secondary" (click)="load()">Tentar novamente</nutri-button>
        </div>
      } @else if (nutritionists().length === 0) {
        <nutri-empty-state
          icon="🩺"
          title="Nenhum nutricionista disponível"
          message="Ainda não há profissionais com perfil publicado no marketplace. Você pode continuar usando a IA enquanto isso."
        />
      } @else {
        <div class="portal-list">
          @for (n of nutritionists(); track n.id) {
            <div class="portal-list-item">
              <div class="portal-list-item__main">
                <strong>{{ n.name }} · CRN {{ n.crn }}</strong>
                <span>{{ n.specialties }} · {{ n.locationLabel || (n.city + '/' + n.stateCode) }}</span>
                <span>R$ {{ n.consultationPriceCents / 100 | number:'1.2-2' }} · {{ n.careDurationDays }} dias de acompanhamento</span>
              </div>
              <nutri-button variant="secondary" size="sm" [disabled]="requestingId === n.id" (click)="request(n.id)">
                {{ requestingId === n.id ? 'Solicitando...' : 'Solicitar' }}
              </nutri-button>
            </div>
          }
        </div>
      }

      <div class="portal-actions">
        <nutri-button variant="ghost" routerLink="/app/perfil">Voltar ao perfil</nutri-button>
      </div>
    </div>
  `,
  styleUrl: '../portal.scss',
})
export class MarketplaceComponent implements OnInit {
  private readonly careRepo = inject(CARE_REPOSITORY);
  private readonly toast = inject(NutriToastService);
  readonly nutritionists = signal<NutritionistPublic[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  requestingId: number | null = null;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.nutritionists.set(await this.careRepo.listNutritionists());
    } catch (e) {
      this.error.set(parseApiError(e).message);
    } finally {
      this.loading.set(false);
    }
  }

  async request(nutritionistId: number): Promise<void> {
    this.requestingId = nutritionistId;
    await withActionFeedback(
      this.toast,
      async () => {
        await this.careRepo.requestCare(nutritionistId);
      },
      {
        success: 'Solicitação enviada. Siga as instruções de pagamento quando disponíveis.',
      },
    );
    this.requestingId = null;
  }
}

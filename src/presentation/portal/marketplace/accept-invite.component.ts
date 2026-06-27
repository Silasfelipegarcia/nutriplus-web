import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { CARE_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [NutriButtonComponent, NutriInfoTipComponent],
  template: `
    <div class="onboarding">
      <div class="onboarding__card">
        <h1>Aceitar convite</h1>
        <p class="onboarding__lead">Código: <strong>{{ code }}</strong></p>
        <nutri-info-tip
          message="Ao aceitar, você compartilha perfil, medições, planos e check-ins com o nutricionista conforme LGPD."
        />
        @if (error) {
          <div class="auth-card__error">{{ error }}</div>
        }
        @if (success) {
          <div class="portal-card portal-card--highlight">Convite aceito com sucesso!</div>
        }
        <div class="onboarding__actions">
          <nutri-button variant="primary" [disabled]="loading || success" (click)="accept()">
            {{ loading ? 'Aceitando...' : 'Aceitar e compartilhar dados' }}
          </nutri-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../../onboarding/onboarding.scss',
})
export class AcceptInviteComponent implements OnInit {
  private readonly careRepo = inject(CARE_REPOSITORY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  code = '';
  loading = false;
  success = false;
  error: string | null = null;

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
  }

  async accept(): Promise<void> {
    if (!this.code) return;
    this.loading = true;
    this.error = null;
    try {
      await this.careRepo.acceptInvite(this.code, '1.0');
      this.analytics.trackInviteAccepted();
      this.success = true;
      setTimeout(() => this.router.navigate(['/app/perfil']), 1500);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Erro ao aceitar convite';
    } finally {
      this.loading = false;
    }
  }
}

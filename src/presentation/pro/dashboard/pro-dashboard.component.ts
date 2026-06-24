import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PRO_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { NutriBadgeComponent } from '../../../design-system/nutri-badge/nutri-badge.component';
import { NutriStatCardComponent } from '../../../design-system/nutri-stat-card/nutri-stat-card.component';
import { ProDashboard, NutritionistPublic } from '../../../domain/entities';

@Component({
  selector: 'app-pro-dashboard',
  standalone: true,
  imports: [DecimalPipe, RouterLink, NutriBadgeComponent, NutriStatCardComponent],
  template: `
    <div class="portal-page">
      @if (profile() && !profile()!.crnVerified) {
        <div class="portal-banner portal-banner--warning">
          <strong>CRN em verificação</strong>
          <p>Seu registro profissional está pendente de aprovação. Você pode usar o portal, mas não aparecerá no marketplace até a verificação.</p>
          <nutri-badge variant="pending">Pendente</nutri-badge>
        </div>
      }

      <div class="portal-main__header">
        <h1>Dashboard Pro</h1>
        <p>Visão geral da sua carteira e receita do mês.</p>
      </div>

      @if (dashboard()) {
        <div class="macro-grid">
          <nutri-stat-card [value]="dashboard()!.activePatients" label="Ativos" />
          <nutri-stat-card [value]="dashboard()!.preEngagedPatients" label="Pré-consulta" />
          <nutri-stat-card [value]="dashboard()!.pendingPaymentPatients" label="Pagamento pendente" />
          <nutri-stat-card
            [value]="'R$ ' + (dashboard()!.monthlyNetCents / 100 | number:'1.2-2')"
            label="Receita líquida"
          />
        </div>
        @if (dashboard()!.recentPatients.length) {
          <section class="portal-section">
            <h2 class="portal-section__title">Pacientes recentes</h2>
            <div class="portal-list">
              @for (p of dashboard()!.recentPatients; track p.id) {
                <a class="portal-list-item" [routerLink]="['/pro/pacientes', p.patientId]">
                  <div class="portal-list-item__main">
                    <strong>{{ p.patientName }}</strong>
                    <span>{{ p.status }}</span>
                  </div>
                </a>
              }
            </div>
          </section>
        }
      } @else if (!loading()) {
        <p>Não foi possível carregar o dashboard.</p>
      }
    </div>
  `,
  styleUrl: '../../portal/portal.scss',
})
export class ProDashboardComponent implements OnInit {
  private readonly proRepo = inject(PRO_REPOSITORY);
  readonly dashboard = signal<ProDashboard | null>(null);
  readonly profile = signal<NutritionistPublic | null>(null);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const [dashboard, profile] = await Promise.all([
        this.proRepo.getDashboard(),
        this.proRepo.getProfile(),
      ]);
      this.dashboard.set(dashboard);
      this.profile.set(profile);
    } finally {
      this.loading.set(false);
    }
  }
}

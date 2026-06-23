import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PRO_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { ProDashboard } from '../../../domain/entities';

@Component({
  selector: 'app-pro-dashboard',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Dashboard Pro</h1>
        <p>Visão geral da sua carteira e receita do mês.</p>
      </div>
      @if (dashboard()) {
        <div class="macro-grid">
          <div class="macro-card"><strong>{{ dashboard()!.activePatients }}</strong><span>Ativos</span></div>
          <div class="macro-card"><strong>{{ dashboard()!.preEngagedPatients }}</strong><span>Pré-consulta</span></div>
          <div class="macro-card"><strong>{{ dashboard()!.pendingPaymentPatients }}</strong><span>Pagamento pendente</span></div>
          <div class="macro-card">
            <strong>R$ {{ dashboard()!.monthlyNetCents / 100 | number:'1.2-2' }}</strong>
            <span>Receita líquida</span>
          </div>
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
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      this.dashboard.set(await this.proRepo.getDashboard());
    } finally {
      this.loading.set(false);
    }
  }
}

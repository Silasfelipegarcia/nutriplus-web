import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminApiService, AdminPerformanceSummary } from '../../infrastructure/http/admin-api.service';
import { AdminPageHeaderComponent } from './admin-page-header.component';

@Component({
  selector: 'app-admin-performance',
  standalone: true,
  imports: [AdminPageHeaderComponent, DecimalPipe],
  template: `
    <app-admin-page-header
      title="Performance"
      subtitle="Latência Tier S, fluxo bootstrap e status de cache em tempo real."
      eyebrow="Plataforma"
    />

    @if (error()) {
      <div class="admin-page__error" role="alert">{{ error() }}</div>
    }

    @if (summary(); as data) {
      <section class="admin-kpi-grid" aria-label="Resumo de performance">
        <div class="admin-kpi" [class.admin-kpi--warn]="data.tierSP95Ms > data.tierSThresholdMs">
          <strong>{{ data.tierSP95Ms | number:'1.0-0' }} ms</strong>
          <span>p95 Tier S (limite {{ data.tierSThresholdMs }} ms)</span>
        </div>
        <div class="admin-kpi" [class.admin-kpi--warn]="data.dashboardFlowSumP95Ms > data.dashboardFlowThresholdMs">
          <strong>{{ data.dashboardFlowSumP95Ms | number:'1.0-0' }} ms</strong>
          <span>Fluxo dashboard (limite {{ data.dashboardFlowThresholdMs }} ms)</span>
        </div>
        <div class="admin-kpi">
          <strong>{{ data.tierSAvgP95Ms | number:'1.0-1' }} ms</strong>
          <span>Média p95 Tier S</span>
        </div>
        <div class="admin-kpi" [class.admin-kpi--warn]="data.criticalFailures > 0">
          <strong>{{ data.criticalFailures }}</strong>
          <span>Falhas críticas</span>
        </div>
        <div class="admin-kpi">
          <strong>{{ data.cacheEnabled ? 'Ativo' : 'Desligado' }}</strong>
          <span>Cache ({{ data.redisConfigured ? 'Redis' : 'Caffeine/local' }})</span>
        </div>
        <div class="admin-kpi">
          <strong>{{ data.environment }}</strong>
          <span>Ambiente · {{ measuredLabel() }}</span>
        </div>
      </section>

      <section class="admin-section">
        <div class="admin-section__head">
          <h2>Endpoints Tier S</h2>
          <p class="admin-section__hint">Medição ao vivo com 3 amostras por rota (sessão admin).</p>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Rota</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>p95</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              @for (row of data.endpoints; track row.path) {
                <tr [class.admin-table__row--warn]="row.slow || row.failed">
                  <td><code>{{ row.method }} {{ row.path }}</code></td>
                  <td>{{ row.description }}</td>
                  <td>{{ row.status }}</td>
                  <td>{{ row.p95Ms }} ms</td>
                  <td>{{ row.grade }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <p class="admin-finance-note">
        Baseline completo: <code>{{ data.baselineDocPath }}</code> no repositório da API.
        Para auditoria local: <code>{{ data.auditScriptHint }}</code>
      </p>
    } @else if (!loading()) {
      <p class="admin-page__empty">Não foi possível carregar o relatório de performance.</p>
    }

    @if (loading()) {
      <div class="admin-skeleton-grid" aria-hidden="true">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
          <div class="admin-skeleton-card"></div>
        }
      </div>
    }
  `,
  styleUrl: './admin.scss',
})
export class AdminPerformanceComponent {
  private readonly adminApi = inject(AdminApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal<AdminPerformanceSummary | null>(null);

  readonly measuredLabel = computed(() => {
    const at = this.summary()?.measuredAt;
    if (!at) return '';
    return new Date(at).toLocaleString('pt-BR');
  });

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.summary.set(await this.adminApi.performanceSummary());
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar performance');
    } finally {
      this.loading.set(false);
    }
  }
}

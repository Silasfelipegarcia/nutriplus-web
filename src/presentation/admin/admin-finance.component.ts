import { Component, computed, inject, signal } from '@angular/core';
import { AdminApiService, AdminFinanceOverview } from '../../infrastructure/http/admin-api.service';
import { AdminPageHeaderComponent } from './admin-page-header.component';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

@Component({
  selector: 'app-admin-finance',
  standalone: true,
  imports: [AdminPageHeaderComponent],
  template: `
    <app-admin-page-header
      title="Financeiro"
      subtitle="Receita da plataforma: assinaturas B2C, taxa Pro e projeções."
      eyebrow="Receita"
    />

    <div class="admin-finance-toolbar">
      <label>
        <span>Mês</span>
        <select [value]="selectedMonth()" (change)="onMonthChange($event)">
          @for (m of monthOptions; track m.value) {
            <option [value]="m.value">{{ m.label }}</option>
          }
        </select>
      </label>
      <label>
        <span>Ano</span>
        <select [value]="selectedYear()" (change)="onYearChange($event)">
          @for (y of yearOptions(); track y) {
            <option [value]="y">{{ y }}</option>
          }
        </select>
      </label>
    </div>

    @if (error()) {
      <div class="admin-page__error" role="alert">{{ error() }}</div>
    }

    @if (overview(); as data) {
      <section class="admin-kpi-grid" aria-label="Receita do mês">
        <div class="admin-kpi admin-kpi--finance">
          <strong>{{ brl(data.totalPlatformRevenueCents) }}</strong>
          <span>Total plataforma no mês</span>
        </div>
        <div class="admin-kpi">
          <strong>{{ brl(data.subscriptionGrossCents) }}</strong>
          <span>Assinaturas ({{ data.subscriptionPaymentCount }} pagamentos)</span>
        </div>
        <div class="admin-kpi">
          <strong>{{ brl(data.proPlatformFeeCents) }}</strong>
          <span>Taxa Pro ({{ data.proConsultationCount }} consultas)</span>
        </div>
        <div class="admin-kpi">
          <strong>{{ brl(data.monthlyRecurringRevenueCents) }}</strong>
          <span>MRR (assinantes ativos)</span>
        </div>
        <div class="admin-kpi">
          <strong>{{ data.activePaidSubscriptions }}</strong>
          <span>Assinantes pagos ativos</span>
        </div>
        <div class="admin-kpi admin-kpi--finance">
          <strong>{{ brl(data.projectedYearlyRevenueCents) }}</strong>
          <span>Projeção anual (MRR × 12)</span>
        </div>
      </section>

      <section class="admin-section">
        <div class="admin-section__head">
          <h2>Histórico — últimos 6 meses</h2>
          <p class="admin-section__hint">Assinaturas aprovadas + taxa Pro sobre consultas pagas.</p>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Assinaturas</th>
                <th>Taxa Pro</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              @for (row of data.history; track row.year + '-' + row.month) {
                <tr [class.admin-table__row--current]="row.year === data.year && row.month === data.month">
                  <td>{{ monthLabel(row.month) }}/{{ row.year }}</td>
                  <td>{{ brl(row.subscriptionGrossCents) }}</td>
                  <td>{{ brl(row.proPlatformFeeCents) }}</td>
                  <td><strong>{{ brl(row.totalPlatformRevenueCents) }}</strong></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <p class="admin-finance-note">
        MRR estima a receita recorrente mensal com base nos planos ativos e preços do catálogo.
        A receita do mês reflete pagamentos aprovados (Mercado Pago) e consultas Pro pagas no período.
      </p>
    } @else if (!loading()) {
      <p class="admin-page__empty">Não foi possível carregar o financeiro.</p>
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
export class AdminFinanceComponent {
  private readonly adminApi = inject(AdminApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly overview = signal<AdminFinanceOverview | null>(null);

  readonly selectedYear = signal(new Date().getFullYear());
  readonly selectedMonth = signal(new Date().getMonth() + 1);

  readonly monthOptions = MONTH_NAMES.map((label, index) => ({
    value: index + 1,
    label,
  }));

  readonly yearOptions = computed(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  });

  constructor() {
    void this.reload();
  }

  onMonthChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.selectedMonth.set(value);
    void this.reload();
  }

  onYearChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.selectedYear.set(value);
    void this.reload();
  }

  monthLabel(month: number): string {
    return MONTH_NAMES[month - 1] ?? String(month);
  }

  brl(cents: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.overview.set(
        await this.adminApi.financeOverview(this.selectedYear(), this.selectedMonth()),
      );
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar financeiro');
      this.overview.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}

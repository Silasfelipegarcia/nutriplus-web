import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService, AdminAccessSummary } from '../../infrastructure/http/admin-api.service';
import { AdminPageHeaderComponent } from './admin-page-header.component';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [RouterLink, AdminPageHeaderComponent],
  template: `
    <app-admin-page-header
      title="Dashboard"
      subtitle="Visão geral da plataforma, filas de aprovação e atalhos operacionais."
      eyebrow="Visão geral"
    />

    @if (error()) {
      <div class="admin-page__error" role="alert">{{ error() }}</div>
    }

    @if (summary(); as s) {
      <section class="admin-kpi-grid" aria-label="Indicadores">
        <a
          routerLink="/admin/acesso"
          class="admin-kpi"
          [class.admin-kpi--alert]="s.pendingApprovalCount > 0"
        >
          <strong>{{ s.pendingApprovalCount }}</strong>
          <span>Aguardando liberação</span>
        </a>
        <a routerLink="/admin/acesso" class="admin-kpi">
          <strong>{{ s.loginEnabledCount }}</strong>
          <span>Logins liberados</span>
        </a>
        <a routerLink="/admin/administradores" class="admin-kpi">
          <strong>{{ s.adminCount }}</strong>
          <span>Administradores</span>
        </a>
        <a
          routerLink="/admin/nutricionistas"
          class="admin-kpi"
          [class.admin-kpi--alert]="s.pendingNutritionistCount > 0"
        >
          <strong>{{ s.pendingNutritionistCount }}</strong>
          <span>CRN pendentes</span>
        </a>
        <div class="admin-kpi">
          <strong>{{ s.totalUsers }}</strong>
          <span>Total de usuários</span>
        </div>
      </section>

      @if (attentionItems().length > 0) {
        <section class="admin-section">
          <div class="admin-section__head">
            <h2>Requer atenção</h2>
          </div>
          <ul class="admin-queue">
            @for (item of attentionItems(); track item.label) {
              <li>
                <span>{{ item.label }}</span>
                <a [routerLink]="item.link">{{ item.action }}</a>
              </li>
            }
          </ul>
        </section>
      }

      <section class="admin-panel-grid">
        <article class="admin-panel">
          <h2>Acesso &amp; aprovações</h2>
          <p>Libere logins, bloqueie contas e promova administradores.</p>
          <a routerLink="/admin/acesso" class="admin-panel__link">Abrir fila de acesso →</a>
        </article>
        <article class="admin-panel">
          <h2>Verificação CRN</h2>
          <p>Aprove ou rejeite nutricionistas antes de aparecerem no marketplace.</p>
          <a routerLink="/admin/nutricionistas" class="admin-panel__link">Ver pendentes →</a>
        </article>
        <article class="admin-panel">
          <h2>Feature flags</h2>
          <p>Ligue ou desligue funcionalidades do app sem deploy.</p>
          <a routerLink="/admin/flags" class="admin-panel__link">Gerenciar flags →</a>
        </article>
      </section>
    }
  `,
  styleUrl: './admin.scss',
})
export class AdminOverviewComponent {
  private readonly adminApi = inject(AdminApiService);
  readonly summary = signal<AdminAccessSummary | null>(null);
  readonly error = signal<string | null>(null);

  readonly attentionItems = computed(() => {
    const s = this.summary();
    if (!s) return [];
    const items: { label: string; link: string; action: string }[] = [];
    if (s.pendingApprovalCount > 0) {
      items.push({
        label: `${s.pendingApprovalCount} cadastro(s) aguardando liberação de login`,
        link: '/admin/acesso',
        action: 'Revisar fila',
      });
    }
    if (s.pendingNutritionistCount > 0) {
      items.push({
        label: `${s.pendingNutritionistCount} nutricionista(s) aguardando verificação de CRN`,
        link: '/admin/nutricionistas',
        action: 'Verificar CRN',
      });
    }
    return items;
  });

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    try {
      this.summary.set(await this.adminApi.summary());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar resumo');
    }
  }
}

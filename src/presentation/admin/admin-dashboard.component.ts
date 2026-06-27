import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { AdminApiService, AdminUserAccess, FeatureFlag } from '../../../infrastructure/http/admin-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, NutriButtonComponent],
  template: `
    <div class="admin-page">
      <header class="admin-page__header">
        <div>
          <h1>Painel Admin</h1>
          <p>Gerencie aprovações de acesso e funcionalidades do app.</p>
        </div>
        <a routerLink="/app/dashboard">Voltar ao app</a>
      </header>

      @if (error()) {
        <div class="admin-page__error" role="alert">{{ error() }}</div>
      }

      @if (summary()) {
        <section class="admin-stats">
          <article><strong>{{ summary()!.pendingApprovalCount }}</strong><span>Aguardando liberação</span></article>
          <article><strong>{{ summary()!.loginEnabledCount }}</strong><span>Com login liberado</span></article>
          <article><strong>{{ summary()!.totalUsers }}</strong><span>Total de usuários</span></article>
        </section>
      }

      <section class="admin-section">
        <h2>Aguardando aprovação</h2>
        @if (pending().length === 0) {
          <p class="admin-empty">Nenhum cadastro pendente.</p>
        } @else {
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Cadastro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (user of pending(); track user.id) {
                <tr>
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.role }}</td>
                  <td>{{ user.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <nutri-button variant="primary" (click)="approve(user)" [disabled]="busyId() === user.id">
                      Liberar login
                    </nutri-button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <section class="admin-section">
        <h2>Usuários com acesso</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Login</th>
            </tr>
          </thead>
          <tbody>
            @for (user of approved(); track user.id) {
              <tr>
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role }}</td>
                <td>
                  @if (user.role === 'ADMIN') {
                    <span>Sempre ativo</span>
                  } @else {
                    <label class="admin-toggle">
                      <input
                        type="checkbox"
                        [checked]="user.loginEnabled"
                        [disabled]="busyId() === user.id"
                        (change)="toggleLogin(user, $any($event.target).checked)"
                      />
                      {{ user.loginEnabled ? 'Liberado' : 'Bloqueado' }}
                    </label>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section class="admin-section">
        <h2>Funcionalidades do app</h2>
        <div class="admin-flags">
          @for (flag of flags(); track flag.code) {
            <article class="admin-flag">
              <div>
                <strong>{{ flag.name }}</strong>
                <p>{{ flag.description }}</p>
                <code>{{ flag.code }}</code>
              </div>
              <label class="admin-toggle">
                <input
                  type="checkbox"
                  [checked]="flag.enabled"
                  [disabled]="busyFlag() === flag.code"
                  (change)="toggleFlag(flag, $any($event.target).checked)"
                />
                {{ flag.enabled ? 'Ligado' : 'Desligado' }}
              </label>
            </article>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .admin-page { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
    .admin-page__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 2rem; }
    .admin-page__header h1 { margin: 0 0 .25rem; }
    .admin-page__header p { margin: 0; color: var(--nutri-text-muted, #666); }
    .admin-page__error { background: #fdecea; color: #b42318; padding: .75rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .admin-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .admin-stats article { background: #fff; border: 1px solid #e8e8e8; border-radius: 12px; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: .25rem; }
    .admin-stats strong { font-size: 1.75rem; }
    .admin-section { margin-bottom: 2.5rem; }
    .admin-section h2 { margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e8e8; }
    th, td { padding: .75rem 1rem; text-align: left; border-bottom: 1px solid #f0f0f0; }
    th { background: #fafafa; font-size: .85rem; text-transform: uppercase; letter-spacing: .03em; color: #666; }
    .admin-empty { color: #666; }
    .admin-flags { display: grid; gap: .75rem; }
    .admin-flag { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: 1rem 1.25rem; background: #fff; border: 1px solid #e8e8e8; border-radius: 12px; }
    .admin-flag p { margin: .25rem 0; color: #666; }
    .admin-flag code { font-size: .75rem; color: #888; }
    .admin-toggle { display: inline-flex; align-items: center; gap: .5rem; cursor: pointer; white-space: nowrap; }
    @media (max-width: 768px) {
      .admin-stats { grid-template-columns: 1fr; }
      .admin-flag { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class AdminDashboardComponent {
  private readonly adminApi = inject(AdminApiService);

  readonly summary = signal<Awaited<ReturnType<AdminApiService['summary']>> | null>(null);
  readonly pending = signal<AdminUserAccess[]>([]);
  readonly approved = signal<AdminUserAccess[]>([]);
  readonly flags = signal<FeatureFlag[]>([]);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);
  readonly busyFlag = signal<string | null>(null);

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.error.set(null);
    try {
      const [summary, pending, approved, flags] = await Promise.all([
        this.adminApi.summary(),
        this.adminApi.pendingUsers(),
        this.adminApi.approvedUsers(),
        this.adminApi.featureFlags(),
      ]);
      this.summary.set(summary);
      this.pending.set(pending);
      this.approved.set(approved);
      this.flags.set(flags);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar painel admin');
    }
  }

  async approve(user: AdminUserAccess): Promise<void> {
    await this.setLogin(user, true);
  }

  async toggleLogin(user: AdminUserAccess, enabled: boolean): Promise<void> {
    await this.setLogin(user, enabled);
  }

  private async setLogin(user: AdminUserAccess, enabled: boolean): Promise<void> {
    this.busyId.set(user.id);
    this.error.set(null);
    try {
      await this.adminApi.setLoginEnabled(user.id, enabled);
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao atualizar acesso');
    } finally {
      this.busyId.set(null);
    }
  }

  async toggleFlag(flag: FeatureFlag, enabled: boolean): Promise<void> {
    this.busyFlag.set(flag.code);
    this.error.set(null);
    try {
      await this.adminApi.updateFeatureFlag(flag.code, enabled);
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao atualizar funcionalidade');
    } finally {
      this.busyFlag.set(null);
    }
  }
}

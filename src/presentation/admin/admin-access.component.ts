import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AdminApiService, AdminUserAccess } from '../../infrastructure/http/admin-api.service';
import { AdminPageHeaderComponent } from './admin-page-header.component';

type AccessTab = 'pending' | 'approved';

@Component({
  selector: 'app-admin-access',
  standalone: true,
  imports: [CommonModule, AdminPageHeaderComponent],
  template: `
    <app-admin-page-header
      title="Acesso &amp; aprovações"
      subtitle="Libere novos cadastros, gerencie logins ativos e promova administradores."
      eyebrow="Operações"
    />

    @if (error()) {
      <div class="admin-page__error" role="alert">{{ error() }}</div>
    }

    <div class="admin-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        [class.active]="tab() === 'pending'"
        [attr.aria-selected]="tab() === 'pending'"
        (click)="tab.set('pending')"
      >
        Pendentes ({{ pending().length }})
      </button>
      <button
        type="button"
        role="tab"
        [class.active]="tab() === 'approved'"
        [attr.aria-selected]="tab() === 'approved'"
        (click)="tab.set('approved')"
      >
        Usuários ativos ({{ approved().length }})
      </button>
    </div>

    @if (tab() === 'pending') {
      <section class="admin-section">
        <div class="admin-section__head">
          <h2>Fila de aprovação</h2>
        </div>
        <label class="admin-filter admin-toggle">
          <input type="checkbox" [checked]="betaOnly()" (change)="betaOnly.set($any($event.target).checked)" />
          Somente solicitações beta
        </label>
        <div class="admin-card admin-table-wrap">
          @if (filteredPending().length === 0) {
            <p class="admin-empty">Nenhum cadastro pendente.</p>
          } @else {
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Papel</th>
                  <th>Origem</th>
                  <th>Campanha</th>
                  <th>Cadastro</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (user of filteredPending(); track user.id) {
                  <tr>
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td>{{ formatPhone(user.contactPhone) }}</td>
                    <td>{{ roleLabel(user.role) }}</td>
                    <td>
                      @if (user.registrationSource === 'BETA_WAITLIST') {
                        <span class="admin-badge">Beta</span>
                      } @else {
                        Aberto
                      }
                    </td>
                    <td>{{ user.acquisitionCampaign || '—' }}</td>
                    <td>{{ user.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                      <div class="admin-actions">
                        <button type="button" class="admin-btn" (click)="approve(user)" [disabled]="busyId() === user.id">
                          Liberar login
                        </button>
                        <button
                          type="button"
                          class="admin-btn admin-btn--danger"
                          (click)="openRejectDialog(user)"
                          [disabled]="busyId() === user.id"
                        >
                          Recusar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </section>
    } @else {
      <section class="admin-section">
        <div class="admin-section__head">
          <h2>Usuários com acesso</h2>
        </div>
        <label class="admin-filter admin-toggle">
          Buscar
          <input
            type="search"
            placeholder="Nome ou e-mail…"
            [value]="search()"
            (input)="search.set($any($event.target).value)"
          />
        </label>
        <div class="admin-card admin-table-wrap">
          @if (filteredApproved().length === 0) {
            <p class="admin-empty">Nenhum usuário encontrado.</p>
          } @else {
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Papel</th>
                  <th>Login</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                @for (user of filteredApproved(); track user.id) {
                  <tr>
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td>{{ formatPhone(user.contactPhone) }}</td>
                    <td>{{ roleLabel(user.role) }}</td>
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
                    <td>
                      @if (user.role === 'ADMIN') {
                        <span>Sim</span>
                      } @else {
                        <button
                          type="button"
                          class="admin-btn admin-btn--secondary"
                          (click)="makeAdmin(user)"
                          [disabled]="busyId() === user.id"
                        >
                          Tornar admin
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </section>
    }

    @if (rejectTarget(); as user) {
      <div class="admin-modal-backdrop" role="presentation" (click)="closeRejectDialog()"></div>
      <div class="admin-modal" role="dialog" aria-labelledby="reject-access-title" aria-modal="true">
        <h3 id="reject-access-title">Recusar acesso</h3>
        <p class="admin-modal__lead">
          O cadastro de <strong>{{ user.email }}</strong> será recusado e a pessoa receberá um e-mail com a decisão.
        </p>
        <label class="admin-modal__field">
          Motivo (opcional)
          <textarea
            rows="3"
            maxlength="500"
            placeholder="Ex.: perfil fora do escopo do beta atual"
            [value]="rejectReason()"
            (input)="rejectReason.set($any($event.target).value)"
          ></textarea>
        </label>
        <div class="admin-modal__actions">
          <button type="button" class="admin-btn admin-btn--secondary" (click)="closeRejectDialog()">Cancelar</button>
          <button
            type="button"
            class="admin-btn admin-btn--danger"
            (click)="confirmReject()"
            [disabled]="busyId() === user.id"
          >
            Confirmar recusa
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './admin.scss',
})
export class AdminAccessComponent {
  private readonly adminApi = inject(AdminApiService);

  readonly pending = signal<AdminUserAccess[]>([]);
  readonly approved = signal<AdminUserAccess[]>([]);
  readonly betaOnly = signal(false);
  readonly search = signal('');
  readonly tab = signal<AccessTab>('pending');
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);
  readonly rejectTarget = signal<AdminUserAccess | null>(null);
  readonly rejectReason = signal('');

  readonly filteredPending = computed(() => {
    const list = this.pending();
    return this.betaOnly() ? list.filter((u) => u.registrationSource === 'BETA_WAITLIST') : list;
  });

  readonly filteredApproved = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.approved();
    if (!q) return list;
    return list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  });

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.error.set(null);
    try {
      const [pending, approved] = await Promise.all([
        this.adminApi.pendingUsers(),
        this.adminApi.approvedUsers(),
      ]);
      this.pending.set(pending);
      this.approved.set(approved);
      if (pending.length === 0 && approved.length > 0 && this.tab() === 'pending') {
        this.tab.set('approved');
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar acesso');
    }
  }

  async approve(user: AdminUserAccess): Promise<void> {
    await this.setLogin(user, true);
  }

  openRejectDialog(user: AdminUserAccess): void {
    this.rejectReason.set('');
    this.rejectTarget.set(user);
  }

  closeRejectDialog(): void {
    if (this.busyId() !== null) return;
    this.rejectTarget.set(null);
    this.rejectReason.set('');
  }

  async confirmReject(): Promise<void> {
    const user = this.rejectTarget();
    if (!user) return;
    this.busyId.set(user.id);
    this.error.set(null);
    try {
      await this.adminApi.rejectUserAccess(user.id, this.rejectReason());
      this.rejectTarget.set(null);
      this.rejectReason.set('');
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao recusar acesso');
    } finally {
      this.busyId.set(null);
    }
  }

  async toggleLogin(user: AdminUserAccess, enabled: boolean): Promise<void> {
    await this.setLogin(user, enabled);
  }

  async makeAdmin(user: AdminUserAccess): Promise<void> {
    if (!confirm(`Tornar ${user.email} administrador?`)) return;
    this.busyId.set(user.id);
    try {
      await this.adminApi.setUserAdmin(user.id, true);
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao promover admin');
    } finally {
      this.busyId.set(null);
    }
  }

  private async setLogin(user: AdminUserAccess, enabled: boolean): Promise<void> {
    this.busyId.set(user.id);
    try {
      await this.adminApi.setLoginEnabled(user.id, enabled);
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao atualizar acesso');
    } finally {
      this.busyId.set(null);
    }
  }

  formatPhone(value?: string): string {
    if (!value) return '—';
    const d = value.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return value;
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'NUTRITIONIST':
        return 'Nutricionista';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'Cliente';
    }
  }
}

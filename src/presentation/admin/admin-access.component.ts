import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AdminAccessSummary,
  AdminApiService,
  AdminUserAccess,
  AdminUserAccessStatus,
} from '../../infrastructure/http/admin-api.service';
import { AdminPageHeaderComponent } from './admin-page-header.component';

type AccessTab = 'pending' | 'approved';

@Component({
  selector: 'app-admin-access',
  standalone: true,
  imports: [CommonModule, AdminPageHeaderComponent],
  template: `
    <app-admin-page-header
      title="Acesso &amp; aprovações"
      subtitle="Libere novos cadastros, gerencie logins ativos, filtre usuários e limpe cadastros."
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
        (click)="switchTab('pending')"
      >
        Pendentes ({{ summary()?.pendingApprovalCount ?? '…' }})
      </button>
      <button
        type="button"
        role="tab"
        [class.active]="tab() === 'approved'"
        [attr.aria-selected]="tab() === 'approved'"
        (click)="switchTab('approved')"
      >
        Usuários ativos ({{ summary()?.loginEnabledCount ?? '…' }})
      </button>
    </div>

    <section class="admin-section">
      <div class="admin-section__head">
        <h2>{{ tab() === 'pending' ? 'Fila de aprovação' : 'Usuários com acesso' }}</h2>
      </div>

      <div class="admin-filters">
        <label class="admin-filter">
          Buscar
          <input
            type="search"
            placeholder="Nome ou e-mail…"
            [value]="search()"
            (input)="onSearchInput($any($event.target).value)"
          />
        </label>

        <label class="admin-filter">
          Papel
          <select [value]="roleFilter()" (change)="onRoleChange($any($event.target).value)">
            <option value="">Todos</option>
            <option value="PATIENT">Cliente</option>
            <option value="NUTRITIONIST">Nutricionista</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>

        <label class="admin-filter">
          Origem
          <select [value]="sourceFilter()" (change)="onSourceChange($any($event.target).value)">
            <option value="">Todas</option>
            <option value="OPEN">Aberto</option>
            <option value="BETA_WAITLIST">Beta</option>
          </select>
        </label>

        <label class="admin-filter">
          Perfil nutricional
          <select [value]="profileFilter()" (change)="onProfileChange($any($event.target).value)">
            <option value="">Todos</option>
            <option value="true">Com perfil</option>
            <option value="false">Sem perfil</option>
          </select>
        </label>
      </div>

      <div class="admin-card admin-table-wrap">
        @if (loading()) {
          <p class="admin-empty">Carregando usuários…</p>
        } @else if (users().length === 0) {
          <p class="admin-empty">Nenhum usuário encontrado.</p>
        } @else {
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Papel</th>
                <th>Perfil</th>
                @if (tab() === 'pending') {
                  <th>Origem</th>
                  <th>Campanha</th>
                  <th>Cadastro</th>
                } @else {
                  <th>Login</th>
                  <th>Admin</th>
                }
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ formatPhone(user.contactPhone) }}</td>
                  <td>{{ roleLabel(user.role) }}</td>
                  <td>{{ user.hasNutritionProfile ? 'Sim' : 'Não' }}</td>
                  @if (tab() === 'pending') {
                    <td>
                      @if (user.registrationSource === 'BETA_WAITLIST') {
                        <span class="admin-badge">Beta</span>
                      } @else {
                        Aberto
                      }
                    </td>
                    <td>{{ user.acquisitionCampaign || '—' }}</td>
                    <td>{{ user.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  } @else {
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
                  }
                  <td>
                    <div class="admin-actions">
                      @if (tab() === 'pending') {
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
                      }
                      @if (user.role !== 'ADMIN') {
                        <button
                          type="button"
                          class="admin-btn admin-btn--danger"
                          (click)="openDeleteDialog(user)"
                          [disabled]="busyId() === user.id"
                        >
                          Excluir
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      @if (totalPages() > 0) {
        <div class="admin-pagination">
          <p class="admin-pagination__meta">{{ pageLabel() }}</p>
          <div class="admin-pagination__actions">
            <button
              type="button"
              class="admin-btn admin-btn--secondary"
              (click)="goToPage(page() - 1)"
              [disabled]="page() <= 0 || loading()"
            >
              Anterior
            </button>
            <span class="admin-pagination__current">Página {{ page() + 1 }} de {{ totalPages() }}</span>
            <button
              type="button"
              class="admin-btn admin-btn--secondary"
              (click)="goToPage(page() + 1)"
              [disabled]="page() + 1 >= totalPages() || loading()"
            >
              Próxima
            </button>
          </div>
        </div>
      }
    </section>

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

    @if (deleteTarget(); as user) {
      <div class="admin-modal-backdrop" role="presentation" (click)="closeDeleteDialog()"></div>
      <div class="admin-modal" role="dialog" aria-labelledby="delete-user-title" aria-modal="true">
        <h3 id="delete-user-title">Excluir usuário</h3>
        <p class="admin-modal__lead">
          A conta de <strong>{{ user.email }}</strong> será removida permanentemente com todos os dados associados.
          Esta ação não pode ser desfeita.
        </p>
        <div class="admin-modal__actions">
          <button type="button" class="admin-btn admin-btn--secondary" (click)="closeDeleteDialog()">Cancelar</button>
          <button
            type="button"
            class="admin-btn admin-btn--danger"
            (click)="confirmDelete()"
            [disabled]="busyId() === user.id"
          >
            Excluir permanentemente
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './admin.scss',
})
export class AdminAccessComponent {
  private readonly adminApi = inject(AdminApiService);
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly summary = signal<AdminAccessSummary | null>(null);
  readonly users = signal<AdminUserAccess[]>([]);
  readonly page = signal(0);
  readonly pageSize = signal(20);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly search = signal('');
  readonly roleFilter = signal('');
  readonly sourceFilter = signal('');
  readonly profileFilter = signal('');
  readonly tab = signal<AccessTab>('pending');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);
  readonly rejectTarget = signal<AdminUserAccess | null>(null);
  readonly rejectReason = signal('');
  readonly deleteTarget = signal<AdminUserAccess | null>(null);

  readonly pageLabel = computed(() => {
    const total = this.totalElements();
    if (total === 0) return 'Nenhum resultado';
    const start = this.page() * this.pageSize() + 1;
    const end = Math.min(total, (this.page() + 1) * this.pageSize());
    return `Mostrando ${start}–${end} de ${total}`;
  });

  constructor() {
    void this.reload();
  }

  switchTab(next: AccessTab): void {
    if (this.tab() === next) return;
    this.tab.set(next);
    this.page.set(0);
    void this.loadUsers();
  }

  onSearchInput(value: string): void {
    this.search.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page.set(0);
      void this.loadUsers();
    }, 300);
  }

  onRoleChange(value: string): void {
    this.roleFilter.set(value);
    this.page.set(0);
    void this.loadUsers();
  }

  onSourceChange(value: string): void {
    this.sourceFilter.set(value);
    this.page.set(0);
    void this.loadUsers();
  }

  onProfileChange(value: string): void {
    this.profileFilter.set(value);
    this.page.set(0);
    void this.loadUsers();
  }

  goToPage(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages()) return;
    this.page.set(nextPage);
    void this.loadUsers();
  }

  async reload(): Promise<void> {
    this.error.set(null);
    try {
      const summary = await this.adminApi.summary();
      this.summary.set(summary);
      if (summary.pendingApprovalCount === 0 && summary.loginEnabledCount > 0 && this.tab() === 'pending') {
        this.tab.set('approved');
      }
      await this.loadUsers();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar acesso');
    }
  }

  async loadUsers(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const profile = this.profileFilter();
      const result = await this.adminApi.searchUsers({
        status: this.currentStatus(),
        page: this.page(),
        size: this.pageSize(),
        search: this.search(),
        role: this.roleFilter() || undefined,
        registrationSource: this.sourceFilter() || undefined,
        hasNutritionProfile: profile === '' ? undefined : profile === 'true',
      });
      this.users.set(result.items);
      this.page.set(result.page);
      this.pageSize.set(result.size);
      this.totalElements.set(result.totalElements);
      this.totalPages.set(result.totalPages);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar usuários');
    } finally {
      this.loading.set(false);
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

  openDeleteDialog(user: AdminUserAccess): void {
    this.deleteTarget.set(user);
  }

  closeDeleteDialog(): void {
    if (this.busyId() !== null) return;
    this.deleteTarget.set(null);
  }

  async confirmDelete(): Promise<void> {
    const user = this.deleteTarget();
    if (!user) return;
    this.busyId.set(user.id);
    this.error.set(null);
    try {
      await this.adminApi.deleteUser(user.id);
      this.deleteTarget.set(null);
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao excluir usuário');
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

  private currentStatus(): AdminUserAccessStatus {
    return this.tab() === 'pending' ? 'PENDING' : 'APPROVED';
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

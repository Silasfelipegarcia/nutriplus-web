import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService, AdminUserAccess } from '../../infrastructure/http/admin-api.service';
import { AdminPageHeaderComponent } from './admin-page-header.component';

@Component({
  selector: 'app-admin-admins',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminPageHeaderComponent],
  template: `
    <app-admin-page-header
      title="Administradores"
      subtitle="Equipe com acesso total ao console. Mantenha ao menos um administrador ativo."
      eyebrow="Equipe"
    />

    @if (error()) {
      <div class="admin-page__error" role="alert">{{ error() }}</div>
    }

    <section class="admin-section">
      <div class="admin-card admin-table-wrap">
        @if (admins().length === 0) {
          <p class="admin-empty">Nenhum administrador cadastrado.</p>
        } @else {
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Desde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (user of admins(); track user.id) {
                <tr>
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <button
                      type="button"
                      class="admin-btn admin-btn--danger"
                      (click)="removeAdmin(user)"
                      [disabled]="busyId() === user.id || admins().length <= 1"
                    >
                      Remover admin
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
      <p class="admin-hint">
        Para adicionar um admin, vá em
        <a routerLink="/admin/acesso">Acesso &amp; aprovações</a>
        e use "Tornar admin" na aba de usuários ativos.
      </p>
    </section>
  `,
  styleUrl: './admin.scss',
})
export class AdminAdminsComponent {
  private readonly adminApi = inject(AdminApiService);

  readonly admins = signal<AdminUserAccess[]>([]);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    try {
      this.admins.set(await this.adminApi.admins());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar administradores');
    }
  }

  async removeAdmin(user: AdminUserAccess): Promise<void> {
    if (!confirm(`Remover ${user.email} como administrador?`)) return;
    this.busyId.set(user.id);
    try {
      await this.adminApi.setUserAdmin(user.id, false);
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao remover admin');
    } finally {
      this.busyId.set(null);
    }
  }
}

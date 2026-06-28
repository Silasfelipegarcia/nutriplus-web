import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { APP_NAME } from '../core/constants';
import { NutriLogoComponent } from '../../design-system/nutri-logo/nutri-logo.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NutriLogoComponent],
  template: `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="admin-sidebar__brand">
          <nutri-logo variant="light" size="sm" />
          <span class="admin-sidebar__badge">Console</span>
        </div>

        <nav class="admin-sidebar__nav" aria-label="Administração">
          <p class="admin-sidebar__group">Visão geral</p>
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Dashboard
          </a>

          <p class="admin-sidebar__group">Operações</p>
          <a routerLink="/admin/acesso" routerLinkActive="active">Acesso &amp; aprovações</a>
          <a routerLink="/admin/nutricionistas" routerLinkActive="active">Verificação CRN</a>

          <p class="admin-sidebar__group">Equipe</p>
          <a routerLink="/admin/administradores" routerLinkActive="active">Administradores</a>

          <p class="admin-sidebar__group">Plataforma</p>
          <a routerLink="/admin/flags" routerLinkActive="active">Feature flags</a>
          <a routerLink="/admin/planos" routerLinkActive="active">Planos de assinatura</a>
        </nav>

        <div class="admin-sidebar__footer">
          <a routerLink="/app/dashboard">← Voltar ao {{ appName }}</a>
        </div>
      </aside>

      <main class="admin-main">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './admin.scss',
})
export class AdminShellComponent {
  readonly appName = APP_NAME;
}

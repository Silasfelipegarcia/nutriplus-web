import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-pro-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="pro-layout">
      <aside class="pro-sidebar">
        <div class="pro-sidebar__brand">
          <strong>Nutri+ Pro</strong>
          <span>Portal do nutricionista</span>
        </div>
        <nav class="pro-sidebar__nav">
          <a routerLink="/pro/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/pro/pacientes" routerLinkActive="active">Pacientes</a>
          <a routerLink="/pro/conversas" routerLinkActive="active">Conversas</a>
          <a routerLink="/pro/convites" routerLinkActive="active">Convites</a>
          <a routerLink="/pro/perfil" routerLinkActive="active">Perfil</a>
        </nav>
        <a class="pro-sidebar__back" routerLink="/app/dashboard">← Voltar ao app paciente</a>
      </aside>
      <main class="pro-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .pro-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      min-height: 100vh;
      background: var(--nutri-surface);
    }
    .pro-sidebar {
      background: #1a2e24;
      color: #e8f5ee;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .pro-sidebar__brand strong {
      display: block;
      font-size: 1.1rem;
    }
    .pro-sidebar__brand span {
      font-size: 0.8rem;
      opacity: 0.75;
    }
    .pro-sidebar__nav {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .pro-sidebar__nav a {
      color: #c8e6d4;
      text-decoration: none;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      font-size: 0.92rem;
      font-weight: 600;
    }
    .pro-sidebar__nav a:hover,
    .pro-sidebar__nav a.active {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    .pro-sidebar__back {
      margin-top: auto;
      color: #9fd4b3;
      font-size: 0.85rem;
      text-decoration: none;
    }
    .pro-main {
      padding: 2rem;
      min-width: 0;
    }
  `,
})
export class ProShellComponent {}

import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NutriLogoComponent } from '../../design-system/nutri-logo/nutri-logo.component';
import { NutriButtonComponent } from '../../design-system/nutri-button/nutri-button.component';
import { AssistantPanelComponent } from './assistant/assistant-panel.component';
import { PlanGeneratingBannerComponent } from '../../design-system/plan-generating-banner/plan-generating-banner.component';
import { AuthFacade } from '../core/auth.facade';
import { MealPlanGenerationFacade } from '../core/meal-plan-generation.facade';
import { PortalDataStore } from '../core/portal-data.store';
import { TokenStorage } from '../../infrastructure/auth/token-storage';
import { FeatureFlagService } from '../../infrastructure/http/feature-flag.service';
import { jwtRoles } from '../core/jwt.util';

interface PortalNavItem {
  path: string;
  label: string;
  icon: string;
}

interface PortalNavGroup {
  id: string;
  label: string;
  items: PortalNavItem[];
}

const NAV_GROUPS: PortalNavGroup[] = [
  {
    id: 'home',
    label: 'Início',
    items: [{ path: '/app/dashboard', label: 'Resumo do dia', icon: '📊' }],
  },
  {
    id: 'nutrition',
    label: 'Alimentação',
    items: [
      { path: '/app/plano', label: 'Plano alimentar', icon: '🍽️' },
      { path: '/app/compras', label: 'Lista de compras', icon: '🛒' },
    ],
  },
  {
    id: 'tracking',
    label: 'Acompanhamento',
    items: [
      { path: '/app/progresso', label: 'Medições', icon: '📏' },
      { path: '/app/evolucao', label: 'Evolução', icon: '📈' },
      { path: '/app/treino', label: 'Treino', icon: '🏃' },
    ],
  },
  {
    id: 'care',
    label: 'Cuidado profissional',
    items: [
      { path: '/app/nutricionistas', label: 'Nutricionistas', icon: '🩺' },
      { path: '/app/conversas', label: 'Conversas', icon: '💬' },
    ],
  },
  {
    id: 'account',
    label: 'Conta',
    items: [
      { path: '/app/perfil', label: 'Meu perfil', icon: '👤' },
      { path: '/app/assinatura', label: 'Assinatura', icon: '💳' },
    ],
  },
];

@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NutriLogoComponent,
    NutriButtonComponent,
    AssistantPanelComponent,
    PlanGeneratingBannerComponent,
  ],
  template: `
    <div class="portal-shell">
      <aside class="portal-sidebar">
        <nutri-logo size="sm" />

        <nav class="portal-sidebar__nav" aria-label="Menu principal">
          @for (group of navGroups(); track group.id) {
            <section class="portal-sidebar__group">
              <h2 class="portal-sidebar__group-label">{{ group.label }}</h2>
              <div class="portal-sidebar__group-items">
                @for (item of group.items; track item.path) {
                  <a [routerLink]="item.path" routerLinkActive="active">
                    <span class="portal-sidebar__icon" aria-hidden="true">{{ item.icon }}</span>
                    <span class="portal-sidebar__text">{{ item.label }}</span>
                  </a>
                }
              </div>
            </section>
          }
        </nav>

        @if (proNav()) {
          <div class="portal-sidebar__admin">
            <a [routerLink]="proNav()!.path" routerLinkActive="active">
              <span class="portal-sidebar__icon" aria-hidden="true">{{ proNav()!.icon }}</span>
              <span class="portal-sidebar__text">{{ proNav()!.label }}</span>
            </a>
          </div>
        }

        @if (adminNav()) {
          <div class="portal-sidebar__admin">
            <a [routerLink]="adminNav()!.path" routerLinkActive="active">
              <span class="portal-sidebar__icon" aria-hidden="true">{{ adminNav()!.icon }}</span>
              <span class="portal-sidebar__text">{{ adminNav()!.label }}</span>
            </a>
          </div>
        }

        <div class="portal-sidebar__footer">
          <nutri-button variant="ghost" size="sm" [block]="true" (click)="logout()">Sair</nutri-button>
        </div>
      </aside>

      <main class="portal-main">
        <app-plan-generating-banner />
        <router-outlet />
      </main>

      <div class="portal-assistant">
        <app-assistant-panel />
      </div>
    </div>
  `,
  styleUrl: './portal.scss',
})
export class PortalShellComponent implements OnInit {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly generation = inject(MealPlanGenerationFacade);
  private readonly portalData = inject(PortalDataStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tokens = inject(TokenStorage);
  private readonly featureFlags = inject(FeatureFlagService);

  readonly navGroups = signal<PortalNavGroup[]>(NAV_GROUPS);
  readonly proNav = signal<PortalNavItem | null>(null);
  readonly adminNav = signal<PortalNavItem | null>(null);

  ngOnInit(): void {
    void this.buildNav();
    void this.generation.bootstrap(this.destroyRef);
    void this.portalData.prefetchPortalCore();
  }

  private async buildNav(): Promise<void> {
    const groups = NAV_GROUPS.map((group) => ({
      ...group,
      items: [...group.items],
    }));

    if (await this.featureFlags.isShoppingFinanceEnabled()) {
      const nutrition = groups.find((g) => g.id === 'nutrition');
      nutrition?.items.push({
        path: '/app/economia',
        label: 'Economia',
        icon: '💰',
      });
    }

    if (jwtRoles(this.tokens.getAccessToken()).includes('NUTRITIONIST')) {
      this.proNav.set({ path: '/pro/dashboard', label: 'Portal Pro', icon: '🩺' });
    }

    if (jwtRoles(this.tokens.getAccessToken()).includes('ADMIN')) {
      this.adminNav.set({ path: '/admin', label: 'Painel admin', icon: '⚙️' });
    }

    this.navGroups.set(groups);
  }

  logout(): void {
    this.generation.stopPolling();
    this.portalData.invalidate(
      'nutritionProfile',
      'checkinStats',
      'todayCheckins',
      'trainingProfile',
      'sportCatalog',
    );
    this.auth.logout();
    this.router.navigate(['/']);
  }
}

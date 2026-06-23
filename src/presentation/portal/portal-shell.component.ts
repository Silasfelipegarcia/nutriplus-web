import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NutriLogoComponent } from '../../design-system/nutri-logo/nutri-logo.component';
import { NutriButtonComponent } from '../../design-system/nutri-button/nutri-button.component';
import { AssistantPanelComponent } from './assistant/assistant-panel.component';
import { AuthFacade } from '../core/auth.facade';
import { MealPlanGenerationFacade } from '../core/meal-plan-generation.facade';
import { PortalDataStore } from '../core/portal-data.store';

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
  ],
  template: `
    <div class="portal-shell">
      <aside class="portal-sidebar">
        <nutri-logo size="sm" />
        <nav class="portal-sidebar__nav">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active">{{ item.icon }} {{ item.label }}</a>
          }
        </nav>
        <div class="portal-sidebar__footer">
          <nutri-button variant="ghost" size="sm" [block]="true" (click)="logout()">Sair</nutri-button>
        </div>
      </aside>
      <main class="portal-main">
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

  readonly navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/app/plano', label: 'Plano', icon: '🍽️' },
    { path: '/app/compras', label: 'Compras', icon: '🛒' },
    { path: '/app/progresso', label: 'Progresso', icon: '📏' },
    { path: '/app/evolucao', label: 'Evolução', icon: '📈' },
    { path: '/app/treino', label: 'Treino', icon: '🏃' },
    { path: '/app/perfil', label: 'Perfil', icon: '👤' },
    { path: '/app/nutricionistas', label: 'Nutricionista', icon: '🩺' },
  ];

  ngOnInit(): void {
    void this.generation.bootstrap(this.destroyRef);
    void this.portalData.prefetchPortalCore();
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

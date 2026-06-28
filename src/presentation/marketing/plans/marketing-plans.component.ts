import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlanCatalogComponent } from '../../subscription/plan-catalog/plan-catalog.component';
import { AuthFacade } from '../../core/auth.facade';
import { FeatureFlagService } from '../../../infrastructure/http/feature-flag.service';

@Component({
  selector: 'app-marketing-plans',
  standalone: true,
  imports: [PlanCatalogComponent, RouterLink],
  template: `
    <div class="marketing-plans">
      <header>
        <h1>Planos Nutri+</h1>
        <p>Grátis para começar. Atleta para treinar com inteligência.</p>
        @if (!auth.isAuthenticated()) {
          @if (registrationOpen()) {
            <a routerLink="/auth/cadastro" class="btn btn-primary">Criar conta grátis</a>
          } @else if (registrationOpen() === false) {
            <a routerLink="/beta" class="btn btn-primary">Participar do beta</a>
          }
        }
      </header>
      <app-plan-catalog [somentePublico]="true" />
    </div>
  `,
  styles: [`
    .marketing-plans { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; }
    header { text-align: center; margin-bottom: 2rem; }
  `],
})
export class MarketingPlansComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  readonly registrationOpen = signal<boolean | null>(null);

  private readonly featureFlags = inject(FeatureFlagService);

  ngOnInit(): void {
    void this.featureFlags.isRegistrationOpen().then((open) => this.registrationOpen.set(open));
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { PlanCatalogComponent } from '../../subscription/plan-catalog/plan-catalog.component';
import { AuthFacade } from '../../core/auth.facade';
import { FeatureFlagService } from '../../../infrastructure/http/feature-flag.service';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';

@Component({
  selector: 'app-marketing-plans',
  standalone: true,
  imports: [PlanCatalogComponent, NutriButtonComponent],
  template: `
    <div class="marketing-plans">
      <header>
        <h1>Planos Nutri+</h1>
        <p>Grátis para começar. Atleta para treinar com inteligência.</p>
        @if (!auth.isAuthenticated()) {
          @if (registrationOpen()) {
            <nutri-button variant="primary" to="/auth/cadastro">Criar conta grátis</nutri-button>
          } @else if (registrationOpen() === false) {
            <nutri-button variant="beta" to="/beta">Participar do beta</nutri-button>
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

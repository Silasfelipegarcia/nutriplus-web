import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlanCatalogComponent } from '../../subscription/plan-catalog/plan-catalog.component';
import { AuthFacade } from '../../core/auth.facade';

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
          <a routerLink="/auth/cadastro" class="btn btn-primary">Criar conta grátis</a>
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
export class MarketingPlansComponent {
  readonly auth = inject(AuthFacade);
}

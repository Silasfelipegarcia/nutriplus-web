import { Component } from '@angular/core';
import { PlanCatalogComponent } from '../../subscription/plan-catalog/plan-catalog.component';

@Component({
  selector: 'app-portal-plans',
  standalone: true,
  imports: [PlanCatalogComponent],
  template: `
    <section class="page">
      <h1>Planos Atleta</h1>
      <p class="lead">Desbloqueie o modo atleta com treinos, MET e macros alinhados ao seu gasto.</p>
      <app-plan-catalog />
    </section>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 960px; }
    .lead { color: #6b7280; margin-bottom: 1rem; }
  `],
})
export class PortalPlansComponent {}

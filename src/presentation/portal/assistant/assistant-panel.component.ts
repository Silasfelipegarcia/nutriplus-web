import { Component, inject, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { agentDisplayName } from '../../../domain/entities';
import { MealPlanGenerationFacade } from '../../core/meal-plan-generation.facade';
import { PortalDataStore } from '../../core/portal-data.store';
import { APP_NAME } from '../../core/constants';

@Component({
  selector: 'app-assistant-panel',
  standalone: true,
  imports: [RouterLink],
  template: `
    <aside class="assistant-panel">
      <div class="assistant-panel__header">
        <div
          class="assistant-avatar"
          [class.assistant-avatar--luna]="persona() === 'LUNA'"
          [class.assistant-avatar--bruno]="persona() === 'BRUNO'"
        >
          {{ persona() === 'BRUNO' ? '⚡' : '💚' }}
        </div>
        <div>
          <p class="assistant-panel__name">{{ displayName() }}</p>
          <p class="assistant-panel__role">Sua assistente {{ appName }}</p>
        </div>
      </div>

      <p class="assistant-greeting">{{ greeting() }}</p>

      @if (generation.phase() === 'generating') {
        <p class="assistant-greeting">
          Preparando seu plano…
        </p>
      }

      <div class="assistant-actions">
        @if (generation.phase() !== 'generating') {
          <button type="button" class="assistant-action" (click)="generatePlan()">
            Gerar novo plano alimentar
          </button>
        }
        <a class="assistant-action" routerLink="/app/progresso" style="text-decoration: none">
          Registrar medições
        </a>
        <a class="assistant-action" routerLink="/app/evolucao" style="text-decoration: none">
          Ver evolução
        </a>
        <a class="assistant-action" routerLink="/app/plano" style="text-decoration: none">
          Marcar refeições de hoje
        </a>
      </div>
    </aside>
  `,
  styleUrl: './assistant-panel.component.scss',
})
export class AssistantPanelComponent implements OnInit {
  readonly appName = APP_NAME;
  readonly generation = inject(MealPlanGenerationFacade);
  readonly portalData = inject(PortalDataStore);
  private readonly router = inject(Router);

  readonly persona = computed(() => this.portalData.nutritionProfile()?.agentPersona ?? 'LUNA');
  readonly displayName = computed(() => agentDisplayName(this.persona()));
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const period = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const name = this.displayName();
    return `${period}, ${name}!`;
  });

  async ngOnInit(): Promise<void> {
    await this.portalData.prefetchPortalCore();
  }

  async generatePlan(): Promise<void> {
    await this.generation.generate('assistant');
    this.router.navigate(['/app/dashboard']);
  }
}

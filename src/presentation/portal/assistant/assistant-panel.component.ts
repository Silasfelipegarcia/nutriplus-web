import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { agentDisplayName } from '../../../domain/entities';
import { MealPlanGenerationFacade } from '../../core/meal-plan-generation.facade';
import { LUNA_TIPS, BRUNO_TIPS } from '../../core/constants';
import { DisclaimerBannerComponent } from '../../../design-system/disclaimer-banner/disclaimer-banner.component';

@Component({
  selector: 'app-assistant-panel',
  standalone: true,
  imports: [RouterLink, DisclaimerBannerComponent],
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
          <p class="assistant-panel__role">Sua assistente Nutri+</p>
        </div>
      </div>

      <p class="assistant-greeting">{{ greeting() }}</p>

      @if (generation.phase() === 'generating') {
        <p class="assistant-greeting">
          {{ displayName() }} está preparando seu plano alimentar...
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

      <p class="assistant-tip">"{{ currentTip() }}"</p>

      <div class="assistant-disclaimer">
        <nutri-disclaimer />
      </div>
    </aside>
  `,
  styleUrl: './assistant-panel.component.scss',
})
export class AssistantPanelComponent implements OnInit {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  readonly generation = inject(MealPlanGenerationFacade);
  private readonly router = inject(Router);

  readonly persona = signal('LUNA');
  readonly adherence = signal(0);

  readonly displayName = computed(() => agentDisplayName(this.persona()));
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const period = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const name = this.displayName();
    const pct = this.adherence();
    if (pct > 0) {
      return `${period}! ${name} está com você — sua aderência esta semana está em ${pct}%.`;
    }
    return `${period}! ${name} está com você na organização alimentar.`;
  });

  readonly currentTip = computed(() => {
    const tips = this.persona() === 'BRUNO' ? BRUNO_TIPS : LUNA_TIPS;
    const idx = new Date().getDate() % tips.length;
    return tips[idx];
  });

  async ngOnInit(): Promise<void> {
    try {
      const profile = await this.nutritionRepo.getNutritionProfile();
      this.persona.set(profile.agentPersona);
    } catch {
      // profile may not exist yet
    }
    try {
      const stats = await this.nutritionRepo.getCheckinStats();
      this.adherence.set(stats.weekAdherencePercent);
    } catch {
      // ignore
    }
  }

  async generatePlan(): Promise<void> {
    await this.generation.generate();
    this.router.navigate(['/app/dashboard']);
  }
}

import { Component, inject } from '@angular/core';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { OnboardingDraftService } from '../onboarding-draft.service';

@Component({
  selector: 'app-onboarding-agent',
  standalone: true,
  imports: [NutriButtonComponent],
  template: `
    <div class="onboarding">
      <div class="onboarding__card">
        <h1>Escolha sua assistente</h1>
        <p class="onboarding__lead">Quem vai te acompanhar na organização alimentar?</p>
        <div class="agent-options">
          <button
            type="button"
            class="agent-option"
            [class.agent-option--selected]="draft.draft().agentPersona === 'LUNA'"
            (click)="select('LUNA')"
          >
            <h3>Luna</h3>
            <p>Acolhedora e encorajadora — ideal se você prefere um tom mais leve e motivador.</p>
          </button>
          <button
            type="button"
            class="agent-option"
            [class.agent-option--selected]="draft.draft().agentPersona === 'BRUNO'"
            (click)="select('BRUNO')"
          >
            <h3>Bruno</h3>
            <p>Objetivo e prático — ideal se você prefere ir direto ao ponto.</p>
          </button>
        </div>
        <div class="onboarding__actions">
          <nutri-button variant="primary" to="/onboarding/tipo" label="Continuar">Continuar</nutri-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../onboarding.scss',
})
export class OnboardingAgentComponent {
  readonly draft = inject(OnboardingDraftService);

  select(persona: string): void {
    this.draft.update({ agentPersona: persona });
  }
}

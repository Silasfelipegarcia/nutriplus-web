import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_COPY } from '../../presentation/core/app-copy';

@Component({
  selector: 'nutri-ai-link',
  standalone: true,
  imports: [RouterLink],
  template: `
    <p class="nutri-ai-link">
      <span>{{ prefix }}</span>
      <a routerLink="/app/perfil" [queryParams]="{ legal: 'ai' }">{{ label }}</a>
    </p>
  `,
  styles: `
    .nutri-ai-link {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--ink-muted, #5c6670);
      line-height: 1.35;
    }
    .nutri-ai-link a {
      color: var(--brand, #3d8b5f);
      font-weight: 600;
      text-decoration: none;
      margin-left: 0.2rem;
    }
    .nutri-ai-link a:hover {
      text-decoration: underline;
    }
  `,
})
export class NutriAiLinkComponent {
  readonly prefix = APP_COPY.aiLinkPrefix;
  readonly label = APP_COPY.aiLinkLabel;
}

import { Component, input } from '@angular/core';

@Component({
  selector: 'nutri-info-tip',
  standalone: true,
  template: `
    <div class="nutri-info-tip" role="note">
      <span class="nutri-info-tip__icon" aria-hidden="true">i</span>
      <p>{{ message() }}</p>
    </div>
  `,
  styles: `
    .nutri-info-tip {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 0.85rem 1rem;
      border-radius: var(--nutri-radius-sm);
      background: rgba(61, 139, 95, 0.08);
      border: 1px solid rgba(61, 139, 95, 0.2);
      margin-bottom: 1rem;
    }
    .nutri-info-tip__icon {
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      background: var(--nutri-brand);
      color: white;
      font-size: 0.7rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.1rem;
    }
    .nutri-info-tip p {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.55;
      color: var(--nutri-ink-muted);
    }
  `,
})
export class NutriInfoTipComponent {
  readonly message = input.required<string>();
}

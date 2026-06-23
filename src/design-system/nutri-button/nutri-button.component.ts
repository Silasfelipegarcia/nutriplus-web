import { Component, Input, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'nutri-button',
  standalone: true,
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (href) {
      <a
        [class]="classes"
        [href]="href"
        [attr.target]="external ? '_blank' : null"
        [attr.rel]="external ? 'noopener noreferrer' : null"
        [attr.aria-disabled]="disabled || null"
      >
        <span class="nutri-btn__label"><ng-content /></span>
      </a>
    } @else if (routerLink) {
      <button
        [class]="classes"
        [routerLink]="routerLink"
        type="button"
        [disabled]="disabled"
        [attr.aria-disabled]="disabled || null"
      >
        <span class="nutri-btn__label"><ng-content /></span>
      </button>
    } @else {
      <button [class]="classes" [type]="type" [disabled]="disabled">
        <span class="nutri-btn__label"><ng-content /></span>
      </button>
    }
  `,
})
export class NutriButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'outline' = 'primary';
  @Input() size: 'md' | 'sm' = 'md';
  @Input() block = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() routerLink?: string | string[];
  @Input() href?: string;
  @Input() external = false;

  get classes(): string {
    return [
      'nutri-btn',
      `nutri-btn--${this.variant}`,
      this.size === 'sm' ? 'nutri-btn--sm' : '',
      this.block ? 'nutri-btn--block' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}

import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_NAME } from '../../presentation/core/constants';

@Component({
  selector: 'nutri-logo',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a class="logo" [class.logo--light]="variant === 'light'" [class.logo--sm]="size === 'sm'" routerLink="/">
      <svg
        class="logo__mark"
        [attr.width]="size === 'sm' ? 28 : 36"
        [attr.height]="size === 'sm' ? 28 : 36"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M24 4C18 4 14 10 14 16C14 24 24 38 24 38C24 38 34 24 34 16C34 10 30 4 24 4Z"
          [attr.fill]="variant === 'light' ? '#ffffff' : '#3D8B5F'"
        />
        <path
          d="M24 12V32"
          stroke="white"
          stroke-width="3"
          stroke-linecap="round"
        />
        <path
          d="M18 22H30"
          stroke="white"
          stroke-width="3"
          stroke-linecap="round"
        />
        <path
          d="M24 38C24 38 20 42 16 44"
          [attr.stroke]="variant === 'light' ? '#ffffff' : '#2F6F4A'"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </svg>
      <span class="logo__wordmark">{{ appName }}</span>
    </a>
  `,
  styleUrl: './nutri-logo.component.scss',
})
export class NutriLogoComponent {
  readonly appName = APP_NAME;
  @Input() variant: 'default' | 'light' = 'default';
  @Input() size: 'md' | 'sm' = 'md';
}

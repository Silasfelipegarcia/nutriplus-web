import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-nutri-icon',
  standalone: true,
  template: `
    <svg
      class="nutri-icon"
      [class]="'nutri-icon--' + name"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      @switch (name) {
        @case ('leaf') {
          <path d="M12 2C8 6 4 10 4 15a8 8 0 0016 0c0-5-4-9-8-13z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
          <path d="M12 2v20M12 12c-2 2-3 4-3 6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        }
        @case ('chart') {
          <path d="M4 19V5M4 19h16M8 17V11M12 17V7M16 17v-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        }
        @case ('plate') {
          <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.75"/>
          <path d="M8 14h8M9 10h6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        }
        @case ('cart') {
          <path d="M6 6h14l-1.5 9H8L6 6zM6 6L5 3H2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="10" cy="19" r="1.5" fill="currentColor"/>
          <circle cx="17" cy="19" r="1.5" fill="currentColor"/>
        }
        @case ('check') {
          <path d="M9 12l2 2 4-4M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        }
        @case ('trend') {
          <path d="M4 16l4-4 4 3 8-9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 6h3v3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        }
        @case ('run') {
          <circle cx="14" cy="5" r="2" stroke="currentColor" stroke-width="1.75"/>
          <path d="M6 21l3-7 4 1 3-5 2 3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('shield') {
          <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
          <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        }
        @case ('lock') {
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.75"/>
          <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" stroke-width="1.75"/>
        }
        @case ('doc') {
          <path d="M8 4h8l4 4v12H8V4z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
          <path d="M16 4v4h4M10 12h8M10 16h6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        }
        @case ('brain') {
          <path d="M8 8a3 3 0 016 0 3 3 0 016 0 3 3 0 01-2 5.5V18H10v-4.5A3 3 0 018 8z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
        }
        @case ('science') {
          <path d="M10 2v6l-5 9a2 2 0 001.7 3h10.6a2 2 0 001.7-3l-5-9V2" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
          <path d="M8 14h8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        }
      }
    </svg>
  `,
  styles: [
    `
      .nutri-icon {
        display: block;
        flex-shrink: 0;
      }
    `,
  ],
})
export class NutriIconComponent {
  @Input() name:
    | 'leaf'
    | 'chart'
    | 'plate'
    | 'cart'
    | 'check'
    | 'trend'
    | 'run'
    | 'shield'
    | 'lock'
    | 'doc'
    | 'brain'
    | 'science' = 'leaf';
  @Input() size = 24;
}

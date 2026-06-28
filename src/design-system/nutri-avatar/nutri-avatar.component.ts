import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'nutri-avatar',
  standalone: true,
  template: `
    <div
      class="nutri-avatar"
      [class.nutri-avatar--sm]="size === 'sm'"
      [class.nutri-avatar--lg]="size === 'lg'"
      [class.nutri-avatar--uploadable]="uploadable"
    >
      @if (photoUrl) {
        <img [src]="photoUrl" [alt]="name || 'Foto'" class="nutri-avatar__img" />
      } @else {
        <span class="nutri-avatar__initials" aria-hidden="true">{{ initials }}</span>
      }
      @if (uploadable) {
        <button
          type="button"
          class="nutri-avatar__overlay"
          (click)="uploadClick.emit()"
          [disabled]="uploadDisabled"
          [attr.aria-label]="uploadLabel"
        >
          @if (uploadBusy) {
            <span class="nutri-avatar__spinner" aria-hidden="true"></span>
          } @else {
            <svg class="nutri-avatar__camera" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"
              />
            </svg>
          }
        </button>
      }
    </div>
  `,
  styleUrl: './nutri-avatar.component.scss',
})
export class NutriAvatarComponent {
  @Input() name = '';
  @Input() photoUrl?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() uploadable = false;
  @Input() uploadDisabled = false;
  @Input() uploadBusy = false;
  @Input() uploadLabel = 'Alterar foto';
  @Output() uploadClick = new EventEmitter<void>();

  get initials(): string {
    const parts = this.name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
}

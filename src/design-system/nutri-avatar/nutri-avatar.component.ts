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
        <button type="button" class="nutri-avatar__overlay" (click)="uploadClick.emit()" [attr.aria-label]="uploadLabel">
          <span aria-hidden="true">📷</span>
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
  @Input() uploadLabel = 'Alterar foto';
  @Output() uploadClick = new EventEmitter<void>();

  get initials(): string {
    const parts = this.name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
}

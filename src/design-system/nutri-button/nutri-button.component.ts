import {
  AfterContentInit,
  Component,
  ElementRef,
  Input,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'nutri-button',
  standalone: true,
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Slot fixo fora do @if: o Angular só projeta conteúdo no primeiro ng-content estável -->
    <span class="nutri-btn__source" hidden aria-hidden="true"><ng-content /></span>
    @if (href || to) {
      <a
        [class]="classes"
        [routerLink]="to"
        [href]="href"
        [attr.target]="external && href ? '_blank' : null"
        [attr.rel]="external && href ? 'noopener noreferrer' : null"
        [attr.aria-disabled]="disabled || null"
        [class.nutri-btn--disabled]="disabled"
        (click)="onLinkClick($event)"
      >
        <span class="nutri-btn__label">{{ labelText() }}</span>
      </a>
    } @else {
      <button [class]="classes" [type]="type" [disabled]="disabled">
        <span class="nutri-btn__label">{{ labelText() }}</span>
      </button>
    }
  `,
})
export class NutriButtonComponent implements AfterContentInit {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'outline' = 'primary';
  @Input() size: 'md' | 'sm' = 'md';
  @Input() block = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() to?: string | string[];
  @Input() href?: string;
  @Input() external = false;
  /** Texto explícito (opcional). Se omitido, usa o conteúdo projetado. */
  @Input() label?: string;

  readonly labelText = signal('');

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

  ngAfterContentInit(): void {
    this.syncLabel();
  }

  onLinkClick(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private syncLabel(): void {
    if (this.label?.trim()) {
      this.labelText.set(this.label.trim());
      return;
    }
    const source = this.host.nativeElement.querySelector('.nutri-btn__source');
    this.labelText.set(source?.textContent?.trim() ?? '');
  }
}

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
import { AnalyticsService } from '../../infrastructure/analytics/analytics.service';

@Component({
  selector: 'nutri-button',
  standalone: true,
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Slot fixo fora do @if: o Angular só projeta conteúdo no primeiro ng-content estável -->
    <span class="nutri-btn__source" hidden aria-hidden="true"><ng-content /></span>
    @if (to) {
      <a
        [class]="classes"
        [routerLink]="to"
        [attr.aria-disabled]="disabled || null"
        [class.nutri-btn--disabled]="disabled"
        (click)="onLinkClick($event)"
      >
        <span class="nutri-btn__label">{{ labelText() }}</span>
      </a>
    } @else if (href) {
      <a
        [class]="classes"
        [href]="href"
        [attr.download]="download || null"
        [attr.target]="linkTarget"
        [attr.rel]="linkRel"
        [attr.aria-disabled]="disabled || null"
        [class.nutri-btn--disabled]="disabled"
        (click)="onLinkClick($event)"
      >
        <span class="nutri-btn__label">{{ labelText() }}</span>
      </a>
    } @else {
      <button [class]="classes" [type]="type" [disabled]="disabled" (click)="onButtonClick()">
        <span class="nutri-btn__label">{{ labelText() }}</span>
      </button>
    }
  `,
})
export class NutriButtonComponent implements AfterContentInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly analytics = inject(AnalyticsService);

  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'outline' | 'beta' = 'primary';
  @Input() size: 'md' | 'sm' = 'md';
  @Input() block = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() to?: string | string[];
  @Input() href?: string;
  /** Same-tab file download (ex.: APK). Evita target=_blank no Android. */
  @Input() download?: string;
  @Input() external = false;
  /** Texto explícito (opcional). Se omitido, usa o conteúdo projetado. */
  @Input() label?: string;
  @Input() analyticsCta?: string;
  @Input() analyticsLocation?: string;

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

  /** APK e arquivos locais: mesma aba dispara o gerenciador de downloads no Android. */
  get linkTarget(): string | null {
    if (this.download) return null;
    if (this.external && this.href) return '_blank';
    return null;
  }

  get linkRel(): string | null {
    if (this.linkTarget === '_blank') return 'noopener noreferrer';
    return null;
  }

  ngAfterContentInit(): void {
    this.syncLabel();
  }

  onLinkClick(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.trackCta();
  }

  onButtonClick(): void {
    this.trackCta();
  }

  private trackCta(): void {
    if (this.analyticsCta && this.analyticsLocation) {
      this.analytics.trackCtaClick(this.analyticsCta, this.analyticsLocation);
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

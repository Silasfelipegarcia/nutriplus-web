import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  inject,
  Injector,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AnalyticsRouterService } from '../../../infrastructure/analytics/analytics-router.service';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';
import { CookieConsentService } from '../../../infrastructure/analytics/cookie-consent.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="cookie-banner"
      [class.cookie-banner--visible]="visible()"
      role="dialog"
      aria-label="Consentimento de cookies"
      [attr.aria-hidden]="!visible()"
    >
      <div class="cookie-banner__inner">
        <p class="cookie-banner__text">
          Usamos cookies essenciais e, com seu consentimento, cookies de análise para melhorar sua
          experiência.
          <a routerLink="/cookies">Saiba mais</a>
        </p>
        <div class="cookie-banner__actions">
          <button type="button" class="nutri-btn nutri-btn--ghost nutri-btn--sm" (click)="reject()">
            Recusar
          </button>
          <button type="button" class="nutri-btn nutri-btn--primary nutri-btn--sm" (click)="accept()">
            Aceitar
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './cookie-banner.component.scss',
})
export class CookieBannerComponent {
  private readonly consent = inject(CookieConsentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly routerAnalytics = inject(AnalyticsRouterService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  readonly visible = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    afterNextRender(
      () => {
        this.consent.syncFromStorage();

        this.consent.consent$
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((state) => {
            if (state === null) {
              this.show();
            } else {
              this.hide();
            }
          });
      },
      { injector: this.injector },
    );

    this.destroyRef.onDestroy(() => {
      this.document.body.classList.remove('has-cookie-banner');
    });
  }

  accept(): void {
    this.consent.acceptAll();
    this.analytics.onConsentGranted();
    this.routerAnalytics.trackCurrentPage();
  }

  reject(): void {
    this.consent.rejectOptional();
    this.analytics.onConsentRevoked();
  }

  private show(): void {
    this.visible.set(true);
    this.document.body.classList.add('has-cookie-banner');
  }

  private hide(): void {
    this.visible.set(false);
    this.document.body.classList.remove('has-cookie-banner');
  }
}

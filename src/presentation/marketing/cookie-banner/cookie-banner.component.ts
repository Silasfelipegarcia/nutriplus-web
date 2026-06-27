import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { AnalyticsRouterService } from '../../../infrastructure/analytics/analytics-router.service';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';
import { CookieConsentService } from '../../../infrastructure/analytics/cookie-consent.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [NutriButtonComponent, RouterLink],
  template: `
    @if (visible()) {
      <div class="cookie-banner" role="dialog" aria-label="Consentimento de cookies">
        <div class="cookie-banner__inner">
          <p class="cookie-banner__text">
            Usamos cookies essenciais e, com seu consentimento, cookies de análise para melhorar sua
            experiência.
            <a routerLink="/cookies">Saiba mais</a>
          </p>
          <div class="cookie-banner__actions">
            <nutri-button variant="ghost" size="sm" (click)="reject()">Recusar</nutri-button>
            <nutri-button variant="primary" size="sm" (click)="accept()">Aceitar</nutri-button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './cookie-banner.component.scss',
})
export class CookieBannerComponent implements OnInit {
  private readonly consent = inject(CookieConsentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly routerAnalytics = inject(AnalyticsRouterService);

  readonly visible = signal(false);

  ngOnInit(): void {
    this.consent.syncFromStorage();
    this.visible.set(!this.consent.hasDecided());
  }

  accept(): void {
    this.consent.acceptAll();
    this.visible.set(false);
    this.analytics.onConsentGranted();
    this.routerAnalytics.trackCurrentPage();
  }

  reject(): void {
    this.consent.rejectOptional();
    this.visible.set(false);
    this.analytics.onConsentRevoked();
  }
}

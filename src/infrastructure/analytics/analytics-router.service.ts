import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RouteAnalyticsConfig } from '../../domain/analytics/analytics.model';
import { AnalyticsService } from './analytics.service';
import { CookieConsentService } from './cookie-consent.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsRouterService {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  private readonly consentService = inject(CookieConsentService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  init(): void {
    if (!this.isBrowser) {
      return;
    }

    this.consentService.consent$.subscribe(() => {
      this.scheduleTrack();
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.scheduleTrack();
      });
  }

  trackCurrentPage(): void {
    if (!this.isBrowser || !this.consentService.hasAnalyticsConsent()) {
      return;
    }

    const url = this.router.url;
    const routeConfig = this.resolveRouteAnalytics();
    const title = this.document.title || 'Nutri+';
    const path = url.split('?')[0].split('#')[0] || '/';

    this.analytics.pageView(path, title, routeConfig ?? undefined);
  }

  private scheduleTrack(): void {
    if (!this.consentService.hasAnalyticsConsent()) {
      return;
    }
    queueMicrotask(() => this.trackCurrentPage());
  }

  private resolveRouteAnalytics(): RouteAnalyticsConfig | null {
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let config: RouteAnalyticsConfig | undefined;

    while (route) {
      if (route.data['analytics']) {
        config = route.data['analytics'] as RouteAnalyticsConfig;
      }
      route = route.firstChild;
    }

    return config ?? null;
  }
}

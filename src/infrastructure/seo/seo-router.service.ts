import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DEFAULT_SEO, RouteSeoConfig } from '../../domain/seo/seo.model';
import { SeoService } from './seo.service';

@Injectable({ providedIn: 'root' })
export class SeoRouterService {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  init(): void {
    this.applyForCurrentRoute();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.applyForCurrentRoute());

    if (this.isBrowser) {
      this.applyForCurrentRoute();
    }
  }

  applyForCurrentRoute(): void {
    const config = this.resolveRouteSeo();
    this.seo.apply(config ?? DEFAULT_SEO);
  }

  private resolveRouteSeo(): RouteSeoConfig | null {
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let config: RouteSeoConfig | undefined;

    while (route) {
      if (route.data['seo']) {
        config = route.data['seo'] as RouteSeoConfig;
      }
      route = route.firstChild;
    }

    return config ?? null;
  }
}

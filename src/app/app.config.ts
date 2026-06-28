import {
  APP_BOOTSTRAP_LISTENER,
  APP_INITIALIZER,
  ApplicationConfig,
  EnvironmentInjector,
  PLATFORM_ID,
  afterNextRender,
  inject,
  provideZoneChangeDetection,
  runInInjectionContext,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { AnalyticsRouterService } from '../infrastructure/analytics/analytics-router.service';
import { AnalyticsService } from '../infrastructure/analytics/analytics.service';
import { CookieConsentService } from '../infrastructure/analytics/cookie-consent.service';
import { SeoRouterService } from '../infrastructure/seo/seo-router.service';
import { AUTH_REPOSITORY } from '../domain/repositories/auth.repository';
import { NUTRITION_REPOSITORY } from '../domain/repositories/nutrition.repository';
import { PRO_REPOSITORY, CARE_REPOSITORY } from '../domain/repositories/pro.repository';
import { HttpAuthRepository } from '../infrastructure/http/http-auth.repository';
import { HttpNutritionRepository } from '../infrastructure/http/http-nutrition.repository';
import { HttpProRepository } from '../infrastructure/http/http-pro.repository';
import { HttpCareRepository } from '../infrastructure/http/http-care.repository';
import { AuthFacade } from '../presentation/core/auth.facade';
import { ChunkLoadRecovery, provideChunkLoadRecovery } from '../presentation/core/chunk-load-recovery';
import { authInterceptor } from '../infrastructure/http/auth.interceptor';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

function bootstrapAuth(auth: AuthFacade): () => Promise<void> {
  return () => auth.bootstrap();
}

function bootstrapAnalytics(): () => void {
  const analytics = inject(AnalyticsService);
  const routerAnalytics = inject(AnalyticsRouterService);
  const seoRouter = inject(SeoRouterService);
  const consentService = inject(CookieConsentService);
  const platformId = inject(PLATFORM_ID);
  const injector = inject(EnvironmentInjector);

  return () => {
    if (!isPlatformBrowser(platformId)) {
      seoRouter.init();
      return;
    }

    runInInjectionContext(injector, () => {
      afterNextRender(() => {
        consentService.syncFromStorage();
        analytics.wireConsentHandling();
        seoRouter.init();
        analytics.initIfConsented();
        routerAnalytics.init();
        if (consentService.hasAnalyticsConsent()) {
          routerAnalytics.trackCurrentPage();
        }
      });
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: AUTH_REPOSITORY, useClass: HttpAuthRepository },
    { provide: NUTRITION_REPOSITORY, useClass: HttpNutritionRepository },
    { provide: PRO_REPOSITORY, useClass: HttpProRepository },
    { provide: CARE_REPOSITORY, useClass: HttpCareRepository },
    HttpAuthRepository,
    HttpNutritionRepository,
    HttpProRepository,
    HttpCareRepository,
    ChunkLoadRecovery,
    provideChunkLoadRecovery(),
    {
      provide: APP_INITIALIZER,
      useFactory: bootstrapAuth,
      deps: [AuthFacade],
      multi: true,
    },
    {
      provide: APP_BOOTSTRAP_LISTENER,
      multi: true,
      useFactory: bootstrapAnalytics,
    }, provideClientHydration(withEventReplay()),
  ],
};

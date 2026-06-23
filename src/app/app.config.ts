import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { AUTH_REPOSITORY } from '../domain/repositories/auth.repository';
import { NUTRITION_REPOSITORY } from '../domain/repositories/nutrition.repository';
import { PRO_REPOSITORY, CARE_REPOSITORY } from '../domain/repositories/pro.repository';
import { HttpAuthRepository } from '../infrastructure/http/http-auth.repository';
import { HttpNutritionRepository } from '../infrastructure/http/http-nutrition.repository';
import { HttpProRepository } from '../infrastructure/http/http-pro.repository';
import { HttpCareRepository } from '../infrastructure/http/http-care.repository';
import { AuthFacade } from '../presentation/core/auth.facade';

function bootstrapAuth(auth: AuthFacade): () => Promise<void> {
  return () => auth.bootstrap();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: AUTH_REPOSITORY, useClass: HttpAuthRepository },
    { provide: NUTRITION_REPOSITORY, useClass: HttpNutritionRepository },
    { provide: PRO_REPOSITORY, useClass: HttpProRepository },
    { provide: CARE_REPOSITORY, useClass: HttpCareRepository },
    HttpAuthRepository,
    HttpNutritionRepository,
    HttpProRepository,
    HttpCareRepository,
    {
      provide: APP_INITIALIZER,
      useFactory: bootstrapAuth,
      deps: [AuthFacade],
      multi: true,
    },
  ],
};

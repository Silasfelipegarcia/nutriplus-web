import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
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

function bootstrapAuth(auth: AuthFacade): () => Promise<void> {
  return () => auth.bootstrap();
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
  ],
};

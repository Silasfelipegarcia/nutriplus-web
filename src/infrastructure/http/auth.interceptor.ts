import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenStorage } from '../auth/token-storage';
import { TokenRefreshService } from './token-refresh.service';

const API_PREFIX = environment.apiBaseUrl;

function isApiRequest(url: string): boolean {
  return url.startsWith(API_PREFIX);
}

function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login')
    || url.includes('/auth/register')
    || url.includes('/auth/beta-request')
    || url.includes('/auth/refresh');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStorage);
  const refreshService = inject(TokenRefreshService);

  if (!isApiRequest(req.url) || isAuthEndpoint(req.url)) {
    return next(req);
  }

  const token = tokens.getAccessToken();
  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      if (isAuthEndpoint(req.url)) {
        return throwError(() => error);
      }

      return from(refreshService.refreshAccessToken()).pipe(
        switchMap((ok) => {
          if (!ok) {
            return throwError(() => error);
          }
          const newToken = tokens.getAccessToken();
          const retryReq = newToken
            ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
            : req;
          return next(retryReq);
        }),
      );
    }),
  );
};

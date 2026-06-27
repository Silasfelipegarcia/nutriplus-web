import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorage } from '../../infrastructure/auth/token-storage';

export function jwtRoles(token: string | null): string[] {
  if (!token) return [];
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return Array.isArray(json.roles) ? json.roles : [];
  } catch {
    return [];
  }
}

export function resolvePrimaryRole(roles: string[]): string {
  if (roles.includes('ADMIN')) return 'admin';
  if (roles.includes('NUTRITIONIST')) return 'nutritionist';
  return 'patient';
}

export const nutritionistGuard: CanActivateFn = () => {
  const tokens = inject(TokenStorage);
  const router = inject(Router);
  const roles = jwtRoles(tokens.getAccessToken());
  if (roles.includes('NUTRITIONIST')) return true;
  return router.createUrlTree(['/app/dashboard']);
};

export const adminGuard: CanActivateFn = () => {
  const tokens = inject(TokenStorage);
  const router = inject(Router);
  const roles = jwtRoles(tokens.getAccessToken());
  if (roles.includes('ADMIN')) return true;
  return router.createUrlTree(['/app/dashboard']);
};

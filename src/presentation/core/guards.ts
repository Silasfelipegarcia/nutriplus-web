import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '../core/auth.facade';
import { isMobileDevice } from '../core/device.util';
export { nutritionistGuard } from '../core/jwt.util';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }
  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/app/dashboard']);
  }
  return true;
};

export const desktopGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (isMobileDevice()) {
    return router.createUrlTree(['/baixar-app']);
  }
  return true;
};

export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (auth.needsOnboarding()) {
    return router.createUrlTree(['/onboarding']);
  }
  return true;
};

export const onboardingOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (!auth.needsOnboarding()) {
    return router.createUrlTree(['/app/dashboard']);
  }
  return true;
};

export const termsGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (auth.needsTerms()) {
    return router.createUrlTree(['/onboarding/termos']);
  }
  return true;
};

export const portalReadyGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  if (auth.needsOnboarding()) return router.createUrlTree(['/onboarding']);
  if (auth.needsTerms()) return router.createUrlTree(['/onboarding/termos']);
  return true;
};

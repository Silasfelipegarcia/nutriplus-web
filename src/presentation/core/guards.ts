import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FeatureFlagService } from '../../infrastructure/http/feature-flag.service';
import { AuthFacade } from '../core/auth.facade';
import { isMobileDevice } from '../core/device.util';
import { hasAnyMobileDownload } from '../core/app-download.config';
export { nutritionistGuard, adminGuard } from '../core/jwt.util';

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
  const flags = inject(FeatureFlagService);
  if (isMobileDevice() && (flags.isAppStoreLinksVisibleSync() || hasAnyMobileDownload)) {
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

export const profileEditGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (auth.needsOnboarding()) {
    return router.createUrlTree(['/onboarding']);
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

export const openRegistrationGuard: CanActivateFn = async () => {
  const flags = inject(FeatureFlagService);
  const router = inject(Router);
  await flags.prefetch();
  if (!flags.isRegistrationOpenSync()) {
    return router.createUrlTree(['/beta']);
  }
  return true;
};

export const betaRegistrationGuard: CanActivateFn = async () => {
  const flags = inject(FeatureFlagService);
  const router = inject(Router);
  await flags.prefetch();
  if (flags.isRegistrationOpenSync()) {
    return router.createUrlTree(['/auth/cadastro']);
  }
  return true;
};

export const shoppingFinanceGuard: CanActivateFn = async () => {
  const flags = inject(FeatureFlagService);
  const router = inject(Router);
  await flags.prefetch();
  if (!flags.isShoppingFinanceEnabledSync()) {
    return router.createUrlTree(['/app/dashboard']);
  }
  return true;
};

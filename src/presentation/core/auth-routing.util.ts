import { jwtRoles } from './jwt.util';

/** Rota pós-login conforme role e estado do perfil paciente. */
export function resolvePostLoginRoute(
  token: string | null,
  needsOnboarding: boolean,
  needsTerms: boolean,
): string {
  const roles = jwtRoles(token);
  if (roles.includes('ADMIN')) return '/admin';
  if (roles.includes('NUTRITIONIST')) return '/pro/dashboard';
  if (needsOnboarding) return '/onboarding';
  if (needsTerms) return '/onboarding/termos';
  return '/app/dashboard';
}

export function isNutritionist(token: string | null): boolean {
  return jwtRoles(token).includes('NUTRITIONIST');
}

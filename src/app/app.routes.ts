import { Routes } from '@angular/router';
import {
  adminGuard,
  authGuard,
  desktopGuard,
  guestGuard,
  nutritionistGuard,
  onboardingGuard,
  onboardingOnlyGuard,
  portalReadyGuard,
} from '../presentation/core/guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('../presentation/marketing/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'privacidade', loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent), data: { legalKey: 'privacidade' } },
  { path: 'termos', loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent), data: { legalKey: 'termos' } },
  { path: 'cookies', loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent), data: { legalKey: 'cookies' } },
  { path: 'seguranca', loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent), data: { legalKey: 'seguranca' } },
  { path: 'baixar-app', loadComponent: () => import('../presentation/mobile-redirect/download-app.component').then(m => m.DownloadAppComponent) },
  {
    path: 'auth/login',
    canActivate: [desktopGuard, guestGuard],
    loadComponent: () => import('../presentation/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'auth/cadastro',
    canActivate: [desktopGuard, guestGuard],
    loadComponent: () => import('../presentation/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'auth/cadastro-nutricionista',
    canActivate: [desktopGuard, guestGuard],
    loadComponent: () => import('../presentation/auth/register-nutritionist/register-nutritionist.component').then(m => m.RegisterNutritionistComponent),
  },
  {
    path: 'convite/:code',
    canActivate: [desktopGuard, authGuard],
    loadComponent: () => import('../presentation/portal/marketplace/accept-invite.component').then(m => m.AcceptInviteComponent),
  },
  {
    path: 'onboarding',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/agent/onboarding-agent.component').then(m => m.OnboardingAgentComponent),
  },
  {
    path: 'onboarding/tipo',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/profile-type/onboarding-profile-type.component').then(m => m.OnboardingProfileTypeComponent),
  },
  {
    path: 'onboarding/treino',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/training/onboarding-training.component').then(m => m.OnboardingTrainingComponent),
  },
  {
    path: 'onboarding/preferencias',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/preferences/onboarding-preferences.component').then(m => m.OnboardingPreferencesComponent),
  },
  {
    path: 'onboarding/metricas',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/metrics/onboarding-metrics.component').then(m => m.OnboardingMetricsComponent),
  },
  {
    path: 'onboarding/dieta',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/diet/onboarding-diet.component').then(m => m.OnboardingDietComponent),
  },
  {
    path: 'onboarding/saude',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/health/onboarding-health.component').then(m => m.OnboardingHealthComponent),
  },
  {
    path: 'onboarding/termos',
    canActivate: [desktopGuard, authGuard, onboardingGuard],
    loadComponent: () => import('../presentation/onboarding/terms/onboarding-terms.component').then(m => m.OnboardingTermsComponent),
  },
  {
    path: 'app',
    canActivate: [desktopGuard, portalReadyGuard],
    loadComponent: () => import('../presentation/portal/portal-shell.component').then(m => m.PortalShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('../presentation/portal/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'plano', loadComponent: () => import('../presentation/portal/meal-plan/meal-plan.component').then(m => m.MealPlanComponent) },
      { path: 'compras', loadComponent: () => import('../presentation/portal/shopping-list/shopping-list.component').then(m => m.ShoppingListComponent) },
      { path: 'progresso', loadComponent: () => import('../presentation/portal/progress/progress.component').then(m => m.ProgressComponent) },
      { path: 'evolucao', loadComponent: () => import('../presentation/portal/evolution/evolution.component').then(m => m.EvolutionComponent) },
      { path: 'treino', loadComponent: () => import('../presentation/portal/training/training.component').then(m => m.TrainingComponent) },
      { path: 'perfil', loadComponent: () => import('../presentation/portal/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'nutricionistas', loadComponent: () => import('../presentation/portal/marketplace/marketplace.component').then(m => m.MarketplaceComponent) },
      { path: 'nutricionistas/:id', loadComponent: () => import('../presentation/portal/marketplace/marketplace-detail.component').then(m => m.MarketplaceDetailComponent) },
    ],
  },
  {
    path: 'pro',
    canActivate: [desktopGuard, authGuard, nutritionistGuard],
    loadComponent: () => import('../presentation/pro/pro-shell.component').then(m => m.ProShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('../presentation/pro/dashboard/pro-dashboard.component').then(m => m.ProDashboardComponent) },
      { path: 'pacientes', loadComponent: () => import('../presentation/pro/patients/pro-patients.component').then(m => m.ProPatientsComponent) },
      { path: 'pacientes/:id', loadComponent: () => import('../presentation/pro/dossier/pro-dossier.component').then(m => m.ProDossierComponent) },
      { path: 'conversas', loadComponent: () => import('../presentation/pro/conversations/pro-conversations.component').then(m => m.ProConversationsComponent) },
      { path: 'conversas/:id', loadComponent: () => import('../presentation/pro/conversations/pro-chat.component').then(m => m.ProChatComponent) },
      { path: 'convites', loadComponent: () => import('../presentation/pro/invites/pro-invites.component').then(m => m.ProInvitesComponent) },
      { path: 'perfil', loadComponent: () => import('../presentation/pro/profile/pro-profile.component').then(m => m.ProProfileComponent) },
    ],
  },
  {
    path: 'admin',
    canActivate: [desktopGuard, authGuard, adminGuard],
    loadComponent: () => import('../presentation/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  { path: '**', redirectTo: '' },
];

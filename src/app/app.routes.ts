import { Routes } from '@angular/router';
import { RouteAnalyticsConfig } from '../domain/analytics/analytics.model';
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

type RouteData = { analytics: RouteAnalyticsConfig; legalKey?: string };

const acq = (step: number, stepName: string): RouteData => ({
  analytics: { funnel: 'acquisition', step, stepName },
});

const act = (step: number, stepName: string): RouteData => ({
  analytics: { funnel: 'activation', step, stepName },
});

const ret = (step: number, stepName: string): RouteData => ({
  analytics: { funnel: 'retention', step, stepName },
});

const mon = (step: number, stepName: string): RouteData => ({
  analytics: { funnel: 'monetization', step, stepName },
});

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../presentation/marketing/landing/landing.component').then(m => m.LandingComponent),
    data: acq(1, 'landing_view'),
  },
  {
    path: 'privacidade',
    loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent),
    data: { ...acq(99, 'legal_privacy_view'), legalKey: 'privacidade' },
  },
  {
    path: 'termos',
    loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent),
    data: { ...acq(99, 'legal_terms_view'), legalKey: 'termos' },
  },
  {
    path: 'cookies',
    loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent),
    data: { ...acq(99, 'legal_cookies_view'), legalKey: 'cookies' },
  },
  {
    path: 'seguranca',
    loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent),
    data: { ...acq(99, 'legal_security_view'), legalKey: 'seguranca' },
  },
  {
    path: 'baixar-app',
    loadComponent: () => import('../presentation/mobile-redirect/download-app.component').then(m => m.DownloadAppComponent),
    data: acq(2, 'download_app_view'),
  },
  {
    path: 'auth/login',
    canActivate: [desktopGuard, guestGuard],
    loadComponent: () => import('../presentation/auth/login/login.component').then(m => m.LoginComponent),
    data: acq(2, 'login_form_view'),
  },
  {
    path: 'auth/cadastro',
    canActivate: [desktopGuard, guestGuard],
    loadComponent: () => import('../presentation/auth/register/register.component').then(m => m.RegisterComponent),
    data: acq(3, 'signup_form_view'),
  },
  {
    path: 'auth/cadastro-nutricionista',
    canActivate: [desktopGuard, guestGuard],
    loadComponent: () => import('../presentation/auth/register-nutritionist/register-nutritionist.component').then(m => m.RegisterNutritionistComponent),
    data: acq(3, 'signup_pro_form_view'),
  },
  {
    path: 'convite/:code',
    canActivate: [desktopGuard, authGuard],
    loadComponent: () => import('../presentation/portal/marketplace/accept-invite.component').then(m => m.AcceptInviteComponent),
    data: mon(2, 'invite_accept_view'),
  },
  {
    path: 'onboarding',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/agent/onboarding-agent.component').then(m => m.OnboardingAgentComponent),
    data: act(1, 'onboarding_agent_view'),
  },
  {
    path: 'onboarding/tipo',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/profile-type/onboarding-profile-type.component').then(m => m.OnboardingProfileTypeComponent),
    data: act(2, 'onboarding_type_view'),
  },
  {
    path: 'onboarding/treino',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/training/onboarding-training.component').then(m => m.OnboardingTrainingComponent),
    data: act(3, 'onboarding_training_view'),
  },
  {
    path: 'onboarding/preferencias',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/preferences/onboarding-preferences.component').then(m => m.OnboardingPreferencesComponent),
    data: act(4, 'onboarding_preferences_view'),
  },
  {
    path: 'onboarding/metricas',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/metrics/onboarding-metrics.component').then(m => m.OnboardingMetricsComponent),
    data: act(5, 'onboarding_metrics_view'),
  },
  {
    path: 'onboarding/dieta',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/diet/onboarding-diet.component').then(m => m.OnboardingDietComponent),
    data: act(6, 'onboarding_diet_view'),
  },
  {
    path: 'onboarding/saude',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/health/onboarding-health.component').then(m => m.OnboardingHealthComponent),
    data: act(7, 'onboarding_health_view'),
  },
  {
    path: 'onboarding/termos',
    canActivate: [desktopGuard, authGuard, onboardingGuard],
    loadComponent: () => import('../presentation/onboarding/terms/onboarding-terms.component').then(m => m.OnboardingTermsComponent),
    data: act(8, 'onboarding_terms_view'),
  },
  {
    path: 'app',
    canActivate: [desktopGuard, portalReadyGuard],
    loadComponent: () => import('../presentation/portal/portal-shell.component').then(m => m.PortalShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('../presentation/portal/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: act(9, 'portal_dashboard_view'),
      },
      {
        path: 'plano',
        loadComponent: () => import('../presentation/portal/meal-plan/meal-plan.component').then(m => m.MealPlanComponent),
        data: act(10, 'meal_plan_view'),
      },
      {
        path: 'compras',
        loadComponent: () => import('../presentation/portal/shopping-list/shopping-list.component').then(m => m.ShoppingListComponent),
        data: ret(2, 'shopping_list_view'),
      },
      {
        path: 'progresso',
        loadComponent: () => import('../presentation/portal/progress/progress.component').then(m => m.ProgressComponent),
        data: ret(2, 'progress_view'),
      },
      {
        path: 'evolucao',
        loadComponent: () => import('../presentation/portal/evolution/evolution.component').then(m => m.EvolutionComponent),
        data: ret(2, 'evolution_view'),
      },
      {
        path: 'treino',
        loadComponent: () => import('../presentation/portal/training/training.component').then(m => m.TrainingComponent),
        data: ret(2, 'training_view'),
      },
      {
        path: 'perfil',
        loadComponent: () => import('../presentation/portal/profile/profile.component').then(m => m.ProfileComponent),
        data: ret(3, 'profile_view'),
      },
      {
        path: 'nutricionistas',
        loadComponent: () => import('../presentation/portal/marketplace/marketplace.component').then(m => m.MarketplaceComponent),
        data: mon(1, 'marketplace_view'),
      },
      {
        path: 'nutricionistas/:id',
        loadComponent: () => import('../presentation/portal/marketplace/marketplace-detail.component').then(m => m.MarketplaceDetailComponent),
        data: mon(2, 'marketplace_detail_view'),
      },
    ],
  },
  {
    path: 'pro',
    canActivate: [desktopGuard, authGuard, nutritionistGuard],
    loadComponent: () => import('../presentation/pro/pro-shell.component').then(m => m.ProShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('../presentation/pro/dashboard/pro-dashboard.component').then(m => m.ProDashboardComponent),
        data: mon(3, 'pro_dashboard_view'),
      },
      {
        path: 'pacientes',
        loadComponent: () => import('../presentation/pro/patients/pro-patients.component').then(m => m.ProPatientsComponent),
        data: mon(4, 'pro_patients_view'),
      },
      {
        path: 'pacientes/:id',
        loadComponent: () => import('../presentation/pro/dossier/pro-dossier.component').then(m => m.ProDossierComponent),
        data: mon(5, 'pro_dossier_view'),
      },
      {
        path: 'conversas',
        loadComponent: () => import('../presentation/pro/conversations/pro-conversations.component').then(m => m.ProConversationsComponent),
        data: mon(4, 'pro_conversations_view'),
      },
      {
        path: 'conversas/:id',
        loadComponent: () => import('../presentation/pro/conversations/pro-chat.component').then(m => m.ProChatComponent),
        data: mon(4, 'pro_chat_view'),
      },
      {
        path: 'convites',
        loadComponent: () => import('../presentation/pro/invites/pro-invites.component').then(m => m.ProInvitesComponent),
        data: mon(4, 'pro_invites_view'),
      },
      {
        path: 'perfil',
        loadComponent: () => import('../presentation/pro/profile/pro-profile.component').then(m => m.ProProfileComponent),
        data: mon(4, 'pro_profile_view'),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [desktopGuard, authGuard, adminGuard],
    loadComponent: () => import('../presentation/admin/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', loadComponent: () => import('../presentation/admin/admin-overview.component').then(m => m.AdminOverviewComponent) },
      { path: 'acesso', loadComponent: () => import('../presentation/admin/admin-access.component').then(m => m.AdminAccessComponent) },
      { path: 'administradores', loadComponent: () => import('../presentation/admin/admin-admins.component').then(m => m.AdminAdminsComponent) },
      { path: 'nutricionistas', loadComponent: () => import('../presentation/admin/admin-nutritionists.component').then(m => m.AdminNutritionistsComponent) },
      { path: 'flags', loadComponent: () => import('../presentation/admin/admin-flags.component').then(m => m.AdminFlagsComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];

import { Routes } from '@angular/router';
import { RouteAnalyticsConfig } from '../domain/analytics/analytics.model';
import { RouteSeoConfig } from '../domain/seo/seo.model';
import {
  adminGuard,
  authGuard,
  betaRegistrationGuard,
  desktopGuard,
  guestGuard,
  nutritionistGuard,
  onboardingGuard,
  onboardingOnlyGuard,
  openRegistrationGuard,
  portalReadyGuard,
  profileEditGuard,
  shoppingFinanceGuard,
} from '../presentation/core/guards';

type RouteData = {
  analytics: RouteAnalyticsConfig;
  seo?: RouteSeoConfig;
  legalKey?: string;
};

const acq = (step: number, stepName: string, seo?: RouteSeoConfig): RouteData => ({
  analytics: { funnel: 'acquisition', step, stepName },
  seo,
});

const act = (step: number, stepName: string, seo?: RouteSeoConfig): RouteData => ({
  analytics: { funnel: 'activation', step, stepName },
  seo,
});

const ret = (step: number, stepName: string, seo?: RouteSeoConfig): RouteData => ({
  analytics: { funnel: 'retention', step, stepName },
  seo,
});

const mon = (step: number, stepName: string, seo?: RouteSeoConfig): RouteData => ({
  analytics: { funnel: 'monetization', step, stepName },
  seo,
});

const privateSeo = (path: string, title: string): RouteSeoConfig => ({
  title,
  description: 'Área restrita do Nutri+.',
  path,
  noindex: true,
});

const HOME_SEO: RouteSeoConfig = {
  title: 'Nutri+ — Seu plano alimentar inteligente',
  description:
    'Organize sua alimentação com planos personalizados por IA, macros calculados e acompanhamento diário com Luna ou Bruno.',
  path: '/',
  ogImage: '/og/default.png',
};

const BETA_SEO: RouteSeoConfig = {
  title: 'Nutri+ Beta — Participe do teste antecipado',
  description:
    'Solicite acesso ao beta do Nutri+: plano alimentar personalizado com IA, lista de compras e acompanhamento diário. Vagas limitadas.',
  path: '/beta',
  ogImage: '/og/beta.png',
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../presentation/marketing/landing/landing.component').then(m => m.LandingComponent),
    data: acq(1, 'landing_view', HOME_SEO),
  },
  {
    path: 'beta',
    canActivate: [betaRegistrationGuard],
    loadComponent: () => import('../presentation/marketing/beta/beta-landing.component').then(m => m.BetaLandingComponent),
    data: acq(2, 'beta_landing_view', BETA_SEO),
  },
  {
    path: 'privacidade',
    loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent),
    data: {
      ...acq(99, 'legal_privacy_view', {
        title: 'Política de Privacidade — Nutri+',
        description: 'Como o Nutri+ coleta, usa e protege seus dados pessoais em conformidade com a LGPD.',
        path: '/privacidade',
      }),
      legalKey: 'privacidade',
    },
  },
  {
    path: 'termos',
    loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent),
    data: {
      ...acq(99, 'legal_terms_view', {
        title: 'Termos de Uso — Nutri+',
        description: 'Termos e condições de uso da plataforma Nutri+.',
        path: '/termos',
      }),
      legalKey: 'termos',
    },
  },
  {
    path: 'cookies',
    loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent),
    data: {
      ...acq(99, 'legal_cookies_view', {
        title: 'Política de Cookies — Nutri+',
        description: 'Informações sobre cookies essenciais e de análise no Nutri+.',
        path: '/cookies',
      }),
      legalKey: 'cookies',
    },
  },
  {
    path: 'seguranca',
    loadComponent: () => import('../presentation/marketing/legal/legal-page.component').then(m => m.LegalPageComponent),
    data: {
      ...acq(99, 'legal_security_view', {
        title: 'Segurança — Nutri+',
        description: 'Práticas de segurança e proteção de dados no Nutri+.',
        path: '/seguranca',
      }),
      legalKey: 'seguranca',
    },
  },
  {
    path: 'baixar-app',
    loadComponent: () => import('../presentation/mobile-redirect/download-app.component').then(m => m.DownloadAppComponent),
    data: acq(2, 'download_app_view', {
      title: 'Baixar app Nutri+ — iOS e Android',
      description: 'Baixe o app Nutri+ na App Store ou Google Play e leve seu plano alimentar para o celular.',
      path: '/baixar-app',
    }),
  },
  {
    path: 'planos',
    loadComponent: () => import('../presentation/marketing/plans/marketing-plans.component').then(m => m.MarketingPlansComponent),
    data: mon(1, 'marketing_plans_view', {
      title: 'Planos Nutri+ — Modo Atleta',
      description: 'Assine o plano Atleta e desbloqueie treinos, MET e macros alinhados ao seu gasto calórico.',
      path: '/planos',
    }),
  },
  {
    path: 'auth/login',
    canActivate: [desktopGuard, guestGuard],
    loadComponent: () => import('../presentation/auth/login/login.component').then(m => m.LoginComponent),
    data: acq(2, 'login_form_view', privateSeo('/auth/login', 'Entrar — Nutri+')),
  },
  {
    path: 'auth/cadastro',
    canActivate: [desktopGuard, guestGuard, openRegistrationGuard],
    loadComponent: () => import('../presentation/auth/register/register.component').then(m => m.RegisterComponent),
    data: acq(3, 'signup_form_view', privateSeo('/auth/cadastro', 'Cadastro — Nutri+')),
  },
  {
    path: 'auth/cadastro-nutricionista',
    canActivate: [desktopGuard, guestGuard],
    loadComponent: () => import('../presentation/auth/register-nutritionist/register-nutritionist.component').then(m => m.RegisterNutritionistComponent),
    data: acq(3, 'signup_pro_form_view', privateSeo('/auth/cadastro-nutricionista', 'Cadastro Pro — Nutri+')),
  },
  {
    path: 'auth/esqueci-senha',
    canActivate: [desktopGuard, guestGuard],
    loadComponent: () => import('../presentation/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: acq(2, 'forgot_password_view', privateSeo('/auth/esqueci-senha', 'Esqueci minha senha — Nutri+')),
  },
  {
    path: 'auth/redefinir-senha',
    canActivate: [desktopGuard, guestGuard],
    loadComponent: () => import('../presentation/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    data: acq(2, 'reset_password_view', privateSeo('/auth/redefinir-senha', 'Redefinir senha — Nutri+')),
  },
  {
    path: 'convite/:code',
    canActivate: [desktopGuard, authGuard],
    loadComponent: () => import('../presentation/portal/marketplace/accept-invite.component').then(m => m.AcceptInviteComponent),
    data: mon(2, 'invite_accept_view', privateSeo('/convite', 'Convite — Nutri+')),
  },
  {
    path: 'onboarding',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/agent/onboarding-agent.component').then(m => m.OnboardingAgentComponent),
    data: act(1, 'onboarding_agent_view', privateSeo('/onboarding', 'Onboarding — Nutri+')),
  },
  {
    path: 'onboarding/tipo',
    canActivate: [desktopGuard, authGuard, onboardingOnlyGuard],
    loadComponent: () => import('../presentation/onboarding/profile-type/onboarding-profile-type.component').then(m => m.OnboardingProfileTypeComponent),
    data: act(2, 'onboarding_type_view', privateSeo('/onboarding/tipo', 'Onboarding — Nutri+')),
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
    data: privateSeo('/app', 'Portal — Nutri+'),
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
        path: 'economia',
        canActivate: [shoppingFinanceGuard],
        loadComponent: () => import('../presentation/portal/shopping-finance/shopping-finance.component').then(m => m.ShoppingFinanceComponent),
        data: ret(2, 'shopping_finance_view'),
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
        path: 'perfil/editar/preferencias',
        canActivate: [profileEditGuard],
        loadComponent: () =>
          import('../presentation/portal/profile/edit/profile-edit-preferences.component').then(
            (m) => m.ProfileEditPreferencesComponent,
          ),
        data: ret(3, 'profile_edit_preferences'),
      },
      {
        path: 'perfil/editar/metricas',
        canActivate: [profileEditGuard],
        loadComponent: () =>
          import('../presentation/portal/profile/edit/profile-edit-metrics.component').then(
            (m) => m.ProfileEditMetricsComponent,
          ),
        data: ret(3, 'profile_edit_metrics'),
      },
      {
        path: 'perfil/editar/saude',
        canActivate: [profileEditGuard],
        loadComponent: () =>
          import('../presentation/portal/profile/edit/profile-edit-health.component').then(
            (m) => m.ProfileEditHealthComponent,
          ),
        data: ret(3, 'profile_edit_health'),
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
      {
        path: 'planos',
        loadComponent: () => import('../presentation/portal/plans/portal-plans.component').then(m => m.PortalPlansComponent),
        data: mon(3, 'portal_plans_view'),
      },
      {
        path: 'planos/sucesso',
        loadComponent: () => import('../presentation/subscription/checkout-result/checkout-result.component').then(m => m.CheckoutResultComponent),
        data: mon(4, 'checkout_success_view'),
      },
      {
        path: 'planos/pendente',
        loadComponent: () => import('../presentation/subscription/checkout-result/checkout-result.component').then(m => m.CheckoutResultComponent),
        data: mon(4, 'checkout_pending_view'),
      },
      {
        path: 'assinatura',
        loadComponent: () => import('../presentation/portal/subscription/portal-subscription.component').then(m => m.PortalSubscriptionComponent),
        data: mon(3, 'portal_subscription_view'),
      },
      {
        path: 'cobranca',
        loadComponent: () => import('../presentation/portal/billing/portal-billing.component').then(m => m.PortalBillingComponent),
        data: mon(3, 'portal_billing_view'),
      },
    ],
  },
  {
    path: 'pro',
    canActivate: [desktopGuard, authGuard, nutritionistGuard],
    loadComponent: () => import('../presentation/pro/pro-shell.component').then(m => m.ProShellComponent),
    data: privateSeo('/pro', 'Nutri+ Pro'),
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
    data: privateSeo('/admin', 'Admin — Nutri+'),
    children: [
      { path: '', loadComponent: () => import('../presentation/admin/admin-overview.component').then(m => m.AdminOverviewComponent) },
      { path: 'financeiro', loadComponent: () => import('../presentation/admin/admin-finance.component').then(m => m.AdminFinanceComponent) },
      { path: 'performance', loadComponent: () => import('../presentation/admin/admin-performance.component').then(m => m.AdminPerformanceComponent) },
      { path: 'acesso', loadComponent: () => import('../presentation/admin/admin-access.component').then(m => m.AdminAccessComponent) },
      { path: 'administradores', loadComponent: () => import('../presentation/admin/admin-admins.component').then(m => m.AdminAdminsComponent) },
      { path: 'nutricionistas', loadComponent: () => import('../presentation/admin/admin-nutritionists.component').then(m => m.AdminNutritionistsComponent) },
      { path: 'flags', loadComponent: () => import('../presentation/admin/admin-flags.component').then(m => m.AdminFlagsComponent) },
      { path: 'planos', loadComponent: () => import('../presentation/admin/admin-plans.component').then(m => m.AdminPlansComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];

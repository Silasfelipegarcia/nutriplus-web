import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  AnalyticsEventName,
  AnalyticsEventParams,
  FunnelId,
  LogoutReason,
  RegistrationMode,
  RouteAnalyticsConfig,
} from '../../domain/analytics/analytics.model';
import { CampaignAttribution } from '../marketing/campaign-attribution.service';
import { sanitizeAnalyticsError } from './analytics-error.util';
import { AnalyticsFlowService } from './analytics-flow.service';
import { CookieConsentService } from './cookie-consent.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly flowService = inject(AnalyticsFlowService);
  private readonly consentService = inject(CookieConsentService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly measurementId = environment.gaId;
  private initialized = false;
  private currentUserId: string | null = null;
  private currentUserRole: string | null = null;
  private readonly pendingEvents: Array<{ event: AnalyticsEventName; params: AnalyticsEventParams }> = [];
  private static readonly MAX_PENDING_EVENTS = 24;

  wireConsentHandling(): void {
    if (!this.isBrowser) {
      return;
    }
    this.consentService.consent$.subscribe((state) => {
      if (state?.analytics) {
        this.init();
        this.flushPending();
      } else if (state && !state.analytics) {
        this.pendingEvents.length = 0;
      }
    });
  }

  init(): void {
    if (!this.isBrowser || !this.measurementId || this.initialized || !this.consentService.hasAnalyticsConsent()) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments);
      };
    }

    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      send_page_view: false,
      anonymize_ip: true,
      cookie_flags: this.gtagCookieFlags(),
    });
    this.initialized = true;

    this.loadGtagScript()
      .then(() => {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        });
      })
      .catch((error) => {
        if (!environment.production) {
          console.warn('[analytics] falha ao carregar gtag', error);
        }
      });
  }

  initIfConsented(): void {
    this.init();
  }

  onConsentGranted(): void {
    this.trackConsentGranted();
    this.init();
    this.flushPending();
  }

  onConsentRevoked(): void {
    this.pendingEvents.length = 0;
    this.trackConsentRejected();
  }

  pageView(path: string, title: string, routeConfig?: RouteAnalyticsConfig): void {
    const params: AnalyticsEventParams = {
      page_path: path,
      page_title: title,
      page_location: `${environment.siteUrl}${path === '/' ? '' : path}`,
      flow_id: this.flowService.getFlowId(),
    };

    this.send('page_view', params);

    if (routeConfig) {
      this.funnelStep(routeConfig.funnel, routeConfig.step, routeConfig.stepName, {
        page_path: path,
      });
    }
  }

  funnelStep(
    funnelId: FunnelId,
    step: number,
    stepName: string,
    extra?: AnalyticsEventParams,
  ): void {
    this.send('funnel_step', {
      funnel_id: funnelId,
      funnel_step: step,
      funnel_step_name: stepName,
      flow_id: this.flowService.getFlowId(),
      user_role: this.currentUserRole ?? undefined,
      ...extra,
    });
  }

  setUser(userId: string, role?: string): void {
    this.currentUserId = userId;
    if (role) {
      this.currentUserRole = role;
    }

    if (!this.isBrowser || !this.measurementId || !this.consentService.hasAnalyticsConsent()) {
      return;
    }

    if (!this.initialized) {
      this.init();
    }
    if (!window.gtag) {
      return;
    }

    window.gtag('config', this.measurementId, { user_id: userId });
    if (role) {
      window.gtag('set', 'user_properties', { user_role: role });
    }
  }

  clearUser(): void {
    this.currentUserId = null;
    this.currentUserRole = null;
  }

  trackConsentGranted(): void {
    this.send('consent_granted', { flow_id: this.flowService.getFlowId() });
  }

  trackConsentRejected(): void {
    this.send('consent_rejected', { flow_id: this.flowService.getFlowId() });
  }

  trackCtaClick(name: string, location: string): void {
    this.send('cta_click', {
      cta_name: name,
      cta_location: location,
      flow_id: this.flowService.getFlowId(),
    });
  }

  trackLoginFormStart(): void {
    this.funnelEvent('login_form_start', 'acquisition', 2, 'login_form_submit');
  }

  trackLogin(role: string): void {
    this.funnelEvent('login', 'acquisition', 2, 'login_success', { user_role: role });
  }

  trackLoginError(errorCode: string): void {
    this.funnelEvent('login_error', 'acquisition', 2, 'login_form_submit', {
      error_code: sanitizeAnalyticsError(errorCode),
    });
  }

  trackSignUpStart(mode: RegistrationMode): void {
    this.funnelEvent('signup_form_start', 'acquisition', 3, 'signup_form_submit', {
      registration_mode: mode,
    });
  }

  trackSignUp(mode: RegistrationMode): void {
    this.funnelEvent('sign_up', 'acquisition', 4, 'signup_complete', {
      registration_mode: mode,
      method: 'email',
    });
  }

  trackSignUpError(errorCode: string, mode: RegistrationMode): void {
    this.funnelEvent('sign_up_error', 'acquisition', 3, 'signup_form_submit', {
      error_code: sanitizeAnalyticsError(errorCode),
      registration_mode: mode,
    });
  }

  trackSignUpProStart(mode: RegistrationMode): void {
    this.funnelEvent('signup_pro_form_start', 'acquisition', 3, 'signup_pro_form_submit', {
      registration_mode: mode,
    });
  }

  trackSignUpPro(mode: RegistrationMode): void {
    this.funnelEvent('sign_up_pro', 'acquisition', 4, 'signup_pro_complete', {
      registration_mode: mode,
      method: 'email',
    });
  }

  trackSignUpProError(errorCode: string, mode: RegistrationMode): void {
    this.funnelEvent('sign_up_pro_error', 'acquisition', 3, 'signup_pro_form_submit', {
      error_code: sanitizeAnalyticsError(errorCode),
      registration_mode: mode,
    });
  }

  trackOnboardingAgentSelected(agent: string): void {
    this.funnelEvent('onboarding_agent_selected', 'activation', 1, 'onboarding_agent', { agent });
  }

  trackOnboardingProfileType(athleteMode: boolean): void {
    this.funnelEvent('onboarding_profile_type', 'activation', 2, 'onboarding_type', {
      athlete_mode: athleteMode,
    });
  }

  trackOnboardingStepCompleted(stepName: string): void {
    this.send('onboarding_step_completed', {
      funnel_id: 'activation',
      funnel_step_name: stepName,
      step_name: stepName,
      flow_id: this.flowService.getFlowId(),
    });
  }

  trackOnboardingProfileSubmitted(): void {
    this.funnelEvent('onboarding_profile_submitted', 'activation', 7, 'onboarding_health');
  }

  trackOnboardingCompleted(): void {
    this.funnelEvent('onboarding_completed', 'activation', 8, 'onboarding_terms');
  }

  trackMealPlanGenerateStart(source: string): void {
    this.funnelEvent('meal_plan_generate_start', 'activation', 9, 'meal_plan_generate', { source });
  }

  trackMealPlanReady(): void {
    this.funnelEvent('meal_plan_ready', 'activation', 10, 'meal_plan_ready');
  }

  trackCheckinDone(mealId: string): void {
    this.funnelEvent('checkin_done', 'retention', 2, 'daily_checkin', { meal_id: mealId });
  }

  trackCheckinSkipped(mealId: string): void {
    this.funnelEvent('checkin_skipped', 'retention', 2, 'daily_checkin', { meal_id: mealId });
  }

  trackMeasurementSaved(): void {
    this.funnelEvent('measurement_saved', 'retention', 2, 'progress_measurement');
  }

  trackReviewGenerated(): void {
    this.funnelEvent('review_generated', 'retention', 2, 'progress_review');
  }

  trackLogout(reason: LogoutReason = 'manual'): void {
    this.send('logout', {
      logout_reason: reason,
      flow_id: this.flowService.getFlowId(),
    });
    this.clearUser();
  }

  trackCareRequestSubmitted(): void {
    this.funnelEvent('care_request_submitted', 'monetization', 2, 'marketplace_care_request');
  }

  trackInviteAccepted(): void {
    this.funnelEvent('invite_accepted', 'monetization', 2, 'invite_accept');
  }

  trackProInviteCreated(): void {
    this.funnelEvent('pro_invite_created', 'monetization', 4, 'pro_invite');
  }

  trackProPlanGenerated(): void {
    this.funnelEvent('pro_plan_generated', 'monetization', 5, 'pro_dossier_plan');
  }

  trackProStripeConnectStart(): void {
    this.funnelEvent('pro_stripe_connect_start', 'monetization', 4, 'pro_stripe_connect');
  }

  trackCampaignLandingView(attribution: CampaignAttribution): void {
    this.send('campaign_landing_view', this.campaignParams(attribution));
  }

  trackBetaSignupStart(mode: RegistrationMode, location: string, attribution: CampaignAttribution): void {
    this.send('beta_signup_start', {
      ...this.campaignParams(attribution),
      registration_mode: mode,
      cta_location: location,
    });
  }

  trackBetaSignupComplete(mode: RegistrationMode, location: string, attribution: CampaignAttribution): void {
    this.send('beta_signup_complete', {
      ...this.campaignParams(attribution),
      registration_mode: mode,
      cta_location: location,
    });
  }

  trackBetaSignupError(
    errorCode: string,
    mode: RegistrationMode,
    location: string,
    attribution: CampaignAttribution,
  ): void {
    this.send('beta_signup_error', {
      ...this.campaignParams(attribution),
      registration_mode: mode,
      cta_location: location,
      error_code: sanitizeAnalyticsError(errorCode),
    });
  }

  private campaignParams(attribution: CampaignAttribution): AnalyticsEventParams {
    return {
      flow_id: this.flowService.getFlowId(),
      utm_source: attribution.acquisitionSource,
      utm_medium: attribution.acquisitionMedium,
      utm_campaign: attribution.acquisitionCampaign,
      landing_path: attribution.acquisitionLanding,
    };
  }

  private funnelEvent(
    event: AnalyticsEventName,
    funnel: FunnelId,
    step: number,
    stepName: string,
    extra: AnalyticsEventParams = {},
  ): void {
    this.send(event, {
      funnel_id: funnel,
      funnel_step: step,
      funnel_step_name: stepName,
      flow_id: this.flowService.getFlowId(),
      user_role: this.currentUserRole ?? undefined,
      ...extra,
    });
  }

  private send(event: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
    const enriched: AnalyticsEventParams = {
      ...params,
      flow_id: params.flow_id ?? this.flowService.getFlowId(),
      user_role: params.user_role ?? this.currentUserRole ?? undefined,
    };

    if (!this.consentService.hasAnalyticsConsent()) {
      if (event !== 'consent_rejected') {
        this.enqueue(event, enriched);
      }
      return;
    }

    this.sendToGa4(event, enriched);
  }

  private enqueue(event: AnalyticsEventName, params: AnalyticsEventParams): void {
    if (this.pendingEvents.length >= AnalyticsService.MAX_PENDING_EVENTS) {
      return;
    }
    this.pendingEvents.push({ event, params });
  }

  private flushPending(): void {
    if (!this.consentService.hasAnalyticsConsent()) {
      return;
    }
    const queue = this.pendingEvents.splice(0);
    for (const { event, params } of queue) {
      this.sendToGa4(event, params);
    }
  }

  private sendToGa4(event: AnalyticsEventName, params: AnalyticsEventParams): void {
    if (!this.isBrowser || !this.measurementId) {
      return;
    }

    if (!this.initialized) {
      this.init();
      if (!window.gtag) {
        return;
      }
    }

    const gaParams = this.toGa4Params(params);
    window.gtag('event', event, gaParams);
  }

  private toGa4Params(params: AnalyticsEventParams): Record<string, string | number | boolean> {
    const ga: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') {
        continue;
      }
      const gaKey = key.length > 40 ? key.slice(0, 40) : key;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        ga[gaKey] = value;
      }
    }

    return ga;
  }

  private loadGtagScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${this.measurementId}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('gtag script failed to load'));
      document.head.appendChild(script);
    });
  }

  private gtagCookieFlags(): string {
    return window.location.protocol === 'https:' ? 'SameSite=None;Secure' : 'SameSite=Lax';
  }
}

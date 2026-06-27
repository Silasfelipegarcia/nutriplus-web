/** Identificadores estáveis dos funis — use os mesmos nomes no GA4 Explorations. */
export type FunnelId = 'acquisition' | 'activation' | 'monetization' | 'retention';

export type LogoutReason = 'manual' | 'session_expired';

export type RegistrationMode = 'open' | 'beta';

export interface RouteAnalyticsConfig {
  funnel: FunnelId;
  step: number;
  stepName: string;
}

export type AnalyticsEventName =
  | 'page_view'
  | 'funnel_step'
  | 'cta_click'
  | 'consent_granted'
  | 'consent_rejected'
  | 'login_form_start'
  | 'login'
  | 'login_error'
  | 'signup_form_start'
  | 'sign_up'
  | 'sign_up_error'
  | 'signup_pro_form_start'
  | 'sign_up_pro'
  | 'sign_up_pro_error'
  | 'onboarding_agent_selected'
  | 'onboarding_profile_type'
  | 'onboarding_step_completed'
  | 'onboarding_profile_submitted'
  | 'onboarding_completed'
  | 'meal_plan_generate_start'
  | 'meal_plan_ready'
  | 'checkin_done'
  | 'checkin_skipped'
  | 'measurement_saved'
  | 'review_generated'
  | 'logout'
  | 'care_request_submitted'
  | 'invite_accepted'
  | 'pro_invite_created'
  | 'pro_plan_generated'
  | 'pro_stripe_connect_start';

export interface AnalyticsEventParams {
  funnel_id?: FunnelId;
  funnel_step?: number;
  funnel_step_name?: string;
  flow_id?: string;
  user_role?: string;
  registration_mode?: RegistrationMode;
  agent?: string;
  athlete_mode?: boolean;
  step_name?: string;
  source?: string;
  meal_id?: string;
  logout_reason?: LogoutReason;
  cta_name?: string;
  cta_location?: string;
  error_code?: string;
  page_path?: string;
  page_title?: string;
  page_location?: string;
  [key: string]: string | number | boolean | undefined;
}

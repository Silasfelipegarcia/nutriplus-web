import { Injectable, inject, signal } from '@angular/core';
import { OnboardingDraft } from '../../../domain/entities';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { AuthFacade } from '../../core/auth.facade';
import { PortalDataStore } from '../../core/portal-data.store';
import { OnboardingDraftService } from '../../onboarding/onboarding-draft.service';
import { OnboardingSubmitService } from '../../onboarding/onboarding-submit.service';

export interface ProfileEditRegeneratePrompt {
  messages: string[];
}

const PREFERENCE_FIELDS: (keyof OnboardingDraft)[] = [
  'foodLikes',
  'foodDislikes',
  'mealNotes',
  'foodBudgetLevel',
  'eatsBreakfast',
  'eatsLunch',
  'eatsAfternoonSnack',
  'eatsDinner',
  'openToRoutineAdjustment',
  'freeExtras',
];

const METRICS_FIELDS: (keyof OnboardingDraft)[] = [
  'sex',
  'birthDate',
  'age',
  'heightCm',
  'currentWeightKg',
  'targetWeightKg',
  'goal',
  'goalTargetWeeks',
  'activityLevel',
  'city',
  'stateCode',
];

const HEALTH_FIELDS: (keyof OnboardingDraft)[] = [
  'dietaryPreference',
  'restriction',
  'healthConditions',
  'medications',
  'allergies',
  'healthNotes',
  'wakeTime',
  'sleepTime',
  'chewingDifficulty',
];

function draftSnapshot(draft: OnboardingDraft): OnboardingDraft {
  return JSON.parse(JSON.stringify(draft)) as OnboardingDraft;
}

function fieldChanged(before: OnboardingDraft, after: OnboardingDraft, field: keyof OnboardingDraft): boolean {
  const a = before[field];
  const b = after[field];
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a) !== JSON.stringify(b);
  }
  return a !== b;
}

function anyFieldChanged(before: OnboardingDraft, after: OnboardingDraft, fields: (keyof OnboardingDraft)[]): boolean {
  return fields.some((field) => fieldChanged(before, after, field));
}

@Injectable({ providedIn: 'root' })
export class ProfileEditService {
  private readonly draftService = inject(OnboardingDraftService);
  private readonly submitService = inject(OnboardingSubmitService);
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly portalData = inject(PortalDataStore);
  private readonly auth = inject(AuthFacade);

  private initialSnapshot: OnboardingDraft | null = null;
  private bootstrapped = false;

  readonly loading = signal(false);
  readonly regeneratePrompt = signal<ProfileEditRegeneratePrompt | null>(null);

  async bootstrap(force = false): Promise<void> {
    if (this.bootstrapped && !force) return;

    this.loading.set(true);
    try {
      if (force) {
        this.bootstrapped = false;
      }
      const profile = await this.nutritionRepo.getNutritionProfile();
      let training = null;
      if (profile.athleteModeEnabled) {
        try {
          training = await this.nutritionRepo.getTrainingProfile();
        } catch {
          training = null;
        }
      }
      this.draftService.hydrateFromProfile(profile, training);
      this.initialSnapshot = draftSnapshot(this.draftService.draft());
      this.bootstrapped = true;
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    const before = this.initialSnapshot ?? draftSnapshot(this.draftService.draft());
    const after = this.draftService.draft();

    await this.submitService.submit(after);
    await this.auth.refreshUser();
    this.portalData.invalidate('nutritionProfile', 'trainingProfile');
    await this.portalData.loadNutritionProfile(true);
    if (after.athleteModeEnabled) {
      await this.portalData.loadTrainingProfile(true);
    }

    const prompt = this.buildRegeneratePrompt(before, after);
    if (prompt) {
      this.regeneratePrompt.set(prompt);
    }

    this.initialSnapshot = draftSnapshot(after);
  }

  clearRegeneratePrompt(): void {
    this.regeneratePrompt.set(null);
  }

  resetSession(): void {
    this.bootstrapped = false;
    this.initialSnapshot = null;
  }

  private buildRegeneratePrompt(before: OnboardingDraft, after: OnboardingDraft): ProfileEditRegeneratePrompt | null {
    const messages: string[] = [];

    if (anyFieldChanged(before, after, PREFERENCE_FIELDS)) {
      messages.push('Preferências atualizadas — gere um novo plano para aplicar.');
    }
    if (anyFieldChanged(before, after, METRICS_FIELDS)) {
      messages.push('Metas recalculadas — gere um novo plano.');
    }
    if (anyFieldChanged(before, after, HEALTH_FIELDS)) {
      messages.push('Informações de saúde atualizadas — considere gerar um novo plano.');
    }

    if (!messages.length) return null;
    return { messages };
  }
}

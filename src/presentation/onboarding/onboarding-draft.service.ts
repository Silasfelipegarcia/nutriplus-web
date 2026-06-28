import { Injectable, signal } from '@angular/core';
import { NutritionProfile, OnboardingActivityDraft, OnboardingDraft, TrainingProfile } from '../../domain/entities';
import { defaultBirthDateForAge } from '../core/date.util';

const DEFAULT_DRAFT: OnboardingDraft = {
  agentPersona: 'LUNA',
  athleteModeEnabled: false,
  activities: [],
  foodLikes: '',
  foodDislikes: '',
  mealNotes: '',
  eatsBreakfast: true,
  eatsLunch: true,
  eatsAfternoonSnack: false,
  eatsDinner: true,
  openToRoutineAdjustment: false,
  freeExtras: [],
  foodBudgetLevel: 'MODERATE',
  age: 30,
  birthDate: defaultBirthDateForAge(30),
  city: '',
  stateCode: '',
  chewingDifficulty: 'NONE',
  seniorWeightLossAck: false,
  goalTargetWeeks: 12,
  sex: 'FEMALE',
  heightCm: 165,
  currentWeightKg: 70,
  targetWeightKg: 65,
  goal: 'LOSE_WEIGHT',
  activityLevel: 'MODERATE',
  dietaryPreference: 'OMNIVORE',
  restriction: 'NONE',
  healthConditions: '',
  medications: '',
  allergies: '',
  healthNotes: '',
  wakeTime: '07:00',
  sleepTime: '22:30',
};

@Injectable({ providedIn: 'root' })
export class OnboardingDraftService {
  readonly draft = signal<OnboardingDraft>({ ...DEFAULT_DRAFT });

  update(partial: Partial<OnboardingDraft>): void {
    this.draft.update((d) => ({ ...d, ...partial }));
  }

  reset(): void {
    this.draft.set({ ...DEFAULT_DRAFT });
  }

  hydrateFromProfile(profile: NutritionProfile, training?: TrainingProfile | null): void {
    const birthDate = profile.birthDate?.slice(0, 10) ?? defaultBirthDateForAge(profile.age);
    const activities: OnboardingActivityDraft[] =
      training?.activities.map((a) => ({
        sportType: a.sportType,
        label: a.label,
        customLabel: a.customLabel,
        daysPerWeek: a.daysPerWeek,
        minutesPerSession: a.minutesPerSession,
      })) ?? [];

    this.draft.set({
      agentPersona: profile.agentPersona ?? 'LUNA',
      athleteModeEnabled: profile.athleteModeEnabled ?? false,
      activities,
      foodLikes: profile.foodLikes ?? '',
      foodDislikes: profile.foodDislikes ?? '',
      mealNotes: profile.mealNotes ?? '',
      eatsBreakfast: profile.eatsBreakfast ?? true,
      eatsLunch: profile.eatsLunch ?? true,
      eatsAfternoonSnack: profile.eatsAfternoonSnack ?? false,
      eatsDinner: profile.eatsDinner ?? true,
      openToRoutineAdjustment: profile.openToRoutineAdjustment ?? false,
      freeExtras: [...(profile.freeExtras ?? [])],
      foodBudgetLevel: profile.foodBudgetLevel ?? 'MODERATE',
      age: profile.age,
      birthDate,
      city: profile.city ?? '',
      stateCode: profile.stateCode ?? '',
      chewingDifficulty: profile.chewingDifficulty ?? 'NONE',
      seniorWeightLossAck: profile.seniorWeightLossAck ?? false,
      goalTargetWeeks: profile.goalTargetWeeks ?? 12,
      sex: profile.sex,
      heightCm: profile.heightCm,
      currentWeightKg: profile.currentWeightKg,
      targetWeightKg: profile.targetWeightKg,
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      dietaryPreference: profile.dietaryPreference,
      restriction: profile.restriction,
      healthConditions: profile.healthConditions ?? '',
      medications: profile.medications ?? '',
      allergies: profile.allergies ?? '',
      healthNotes: profile.healthNotes ?? '',
      wakeTime: profile.wakeTime ?? '07:00',
      sleepTime: profile.sleepTime ?? '22:30',
    });
  }
}

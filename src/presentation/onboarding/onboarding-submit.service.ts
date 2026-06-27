import { Injectable, inject } from '@angular/core';
import { OnboardingDraft, TrainingActivityItem } from '../../domain/entities';
import { NUTRITION_REPOSITORY } from '../../domain/repositories/nutrition.repository';
import { computeAgeFromBirthDate } from '../core/date.util';

@Injectable({ providedIn: 'root' })
export class OnboardingSubmitService {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);

  async submit(draft: OnboardingDraft): Promise<void> {
    const age = draft.birthDate ? computeAgeFromBirthDate(draft.birthDate) : draft.age;
    const profilePayload = {
      agentPersona: draft.agentPersona,
      foodLikes: draft.foodLikes || undefined,
      foodDislikes: draft.foodDislikes || undefined,
      mealNotes: draft.mealNotes || undefined,
      eatsBreakfast: draft.eatsBreakfast,
      eatsLunch: draft.eatsLunch,
      eatsAfternoonSnack: draft.eatsAfternoonSnack,
      eatsDinner: draft.eatsDinner,
      openToRoutineAdjustment: draft.openToRoutineAdjustment,
      freeExtras: draft.freeExtras.length ? draft.freeExtras : undefined,
      foodBudgetLevel: draft.foodBudgetLevel,
      age,
      birthDate: draft.birthDate || undefined,
      city: draft.city || undefined,
      stateCode: draft.stateCode || undefined,
      chewingDifficulty: draft.chewingDifficulty !== 'NONE' ? draft.chewingDifficulty : undefined,
      seniorWeightLossAck: draft.seniorWeightLossAck || undefined,
      goalTargetWeeks: draft.goalTargetWeeks,
      sex: draft.sex,
      heightCm: draft.heightCm,
      currentWeightKg: draft.currentWeightKg,
      targetWeightKg: draft.targetWeightKg,
      goal: draft.goal,
      activityLevel: draft.activityLevel,
      dietaryPreference: draft.dietaryPreference,
      restriction: draft.restriction,
      wakeTime: draft.wakeTime,
      sleepTime: draft.sleepTime,
      healthConditions: draft.healthConditions || undefined,
      medications: draft.medications || undefined,
      allergies: draft.allergies || undefined,
      healthNotes: draft.healthNotes || undefined,
    };

    if (draft.athleteModeEnabled && draft.activities.length) {
      await this.nutritionRepo.completeOnboarding(
        profilePayload,
        true,
        this.toTrainingActivities(draft),
      );
      return;
    }

    await this.nutritionRepo.saveNutritionProfile(profilePayload);
    if (!draft.athleteModeEnabled) {
      try {
        await this.nutritionRepo.saveTrainingProfile(false, []);
      } catch {
        // profile may not exist yet on first save path
      }
    }
  }

  private toTrainingActivities(draft: OnboardingDraft): TrainingActivityItem[] {
    return draft.activities.map((a) => ({
      sportType: a.sportType,
      label: a.customLabel?.trim() || a.label,
      customLabel: a.customLabel,
      daysPerWeek: a.daysPerWeek,
      minutesPerSession: a.minutesPerSession,
      caloriesPerSession: 0,
      caloriesPerWeek: 0,
    }));
  }
}

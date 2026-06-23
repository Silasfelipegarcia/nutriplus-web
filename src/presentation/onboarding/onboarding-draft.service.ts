import { Injectable, signal } from '@angular/core';
import { OnboardingDraft } from '../../domain/entities';

const DEFAULT_DRAFT: OnboardingDraft = {
  agentPersona: 'LUNA',
  athleteModeEnabled: false,
  activities: [],
  foodLikes: '',
  foodDislikes: '',
  mealNotes: '',
  foodBudgetLevel: 'MODERATE',
  age: 30,
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
}

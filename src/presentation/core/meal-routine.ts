export interface MealRoutineSlot {
  field: 'eatsBreakfast' | 'eatsLunch' | 'eatsAfternoonSnack' | 'eatsDinner';
  label: string;
  subtitle: string;
}

export const MEAL_ROUTINE_SLOTS: MealRoutineSlot[] = [
  { field: 'eatsBreakfast', label: 'Café da manhã', subtitle: 'Ex.: pão, ovos, fruta, café' },
  { field: 'eatsLunch', label: 'Almoço', subtitle: 'Refeição principal do meio-dia' },
  { field: 'eatsAfternoonSnack', label: 'Lanche da tarde', subtitle: 'Entre almoço e jantar' },
  { field: 'eatsDinner', label: 'Jantar', subtitle: 'Última refeição do dia' },
];

export const DEFAULT_FREE_EXTRA_SUGGESTIONS = [
  'Salada',
  'Café preto',
  'Chá',
  'Caldo de legumes',
  'Iogurte natural',
  'Fruta',
];

export interface MealRoutineState {
  eatsBreakfast: boolean;
  eatsLunch: boolean;
  eatsAfternoonSnack: boolean;
  eatsDinner: boolean;
  openToRoutineAdjustment: boolean;
  freeExtras: string[];
}

export const DEFAULT_MEAL_ROUTINE: MealRoutineState = {
  eatsBreakfast: true,
  eatsLunch: true,
  eatsAfternoonSnack: false,
  eatsDinner: true,
  openToRoutineAdjustment: false,
  freeExtras: [],
};

export function hasAnyMealRoutine(state: MealRoutineState): boolean {
  return state.eatsBreakfast || state.eatsLunch || state.eatsAfternoonSnack || state.eatsDinner;
}

export function mealRoutineSummary(state: MealRoutineState): string {
  const parts: string[] = [];
  if (state.eatsBreakfast) parts.push('café');
  if (state.eatsLunch) parts.push('almoço');
  if (state.eatsAfternoonSnack) parts.push('lanche da tarde');
  if (state.eatsDinner) parts.push('jantar');
  return parts.length ? parts.join(' · ') : 'Nenhuma refeição marcada';
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
  photoThumbnailUrl?: string;
  hasNutritionProfile: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
  privacyPolicyAcceptedAt?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user: User;
}

export interface NutritionProfile {
  id?: number;
  age: number;
  sex: string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  goal: string;
  activityLevel: string;
  dietaryPreference: string;
  restriction: string;
  agentPersona: string;
  foodLikes?: string;
  foodDislikes?: string;
  mealNotes?: string;
  foodBudgetLevel?: string;
  calculationMethod?: string;
  bodyFatPercent?: number;
  leanMassKg?: number;
  muscleMassKg?: number;
  bmrKcal?: number;
  tdeeKcal?: number;
  targetCalories?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatG?: number;
  athleteModeEnabled?: boolean;
  trainingDailyExtraKcal?: number;
  wakeTime?: string;
  sleepTime?: string;
  healthConditions?: string;
  medications?: string;
  allergies?: string;
  healthNotes?: string;
  updatedAt?: string;
}

export interface MealItem {
  id?: number;
  foodName: string;
  quantityG: number;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export interface Meal {
  id?: number;
  mealType: string;
  name: string;
  items: MealItem[];
}

export interface MealPlan {
  id: number;
  planDate?: string;
  totalCalories?: number;
  totalProteinG?: number;
  totalCarbsG?: number;
  totalFatG?: number;
  disclaimer: string;
  meals: Meal[];
}

export interface ShoppingListItem {
  itemName: string;
  quantity: string;
  category?: string;
}

export interface ShoppingList {
  id: number;
  weekStart?: string;
  weekEnd?: string;
  createdAt?: string;
  items: ShoppingListItem[];
}

export interface MealPlanGenerationStatus {
  jobId: number;
  status: string;
  mealPlanId?: number;
  errorMessage?: string;
  progressHint?: string;
}

export interface TodayMealCheckin {
  mealId: number;
  mealType: string;
  mealName: string;
  status?: string;
}

export interface TodayCheckins {
  meals: TodayMealCheckin[];
  completedCount: number;
  totalCount: number;
}

export interface CheckinStats {
  currentStreak: number;
  weekAdherencePercent: number;
}

export interface ProgressSchedule {
  intervalDays: number;
  due: boolean;
  daysUntilDue: number;
  nextDueOn?: string;
  lastReviewAt?: string;
  lastMeasurementOn?: string;
}

export interface BodyMeasurement {
  id?: number;
  measuredOn: string;
  weightKg: number;
  bodyFatPercent?: number;
  muscleMassKg?: number;
  waistCm?: number;
  hipCm?: number;
  chestCm?: number;
  neckCm?: number;
  armRightCm?: number;
  armLeftCm?: number;
  thighRightCm?: number;
  thighLeftCm?: number;
  notes?: string;
}

export interface ProgressReview {
  id: number;
  status: string;
  trend?: string;
  summary?: string;
  recommendations: string[];
  weekAdherencePercent?: number;
  current?: BodyMeasurement;
  previous?: BodyMeasurement;
  completedAt?: string;
}

export interface SportCatalogItem {
  sportType: string;
  label: string;
  met: number;
  intensityHint: string;
}

export interface TrainingActivityItem {
  id?: number;
  sportType: string;
  label: string;
  daysPerWeek: number;
  minutesPerSession: number;
  caloriesPerSession: number;
  caloriesPerWeek: number;
}

export interface TrainingProfile {
  athleteModeEnabled: boolean;
  activities: TrainingActivityItem[];
  weeklyTrainingKcal?: number;
  dailyExtraKcal?: number;
  baseTargetCalories?: number;
  adjustedTargetCalories?: number;
  appliedToPlan?: boolean;
  /** @deprecated use weeklyTrainingKcal */
  totalWeeklyExtraKcal?: number;
}

export interface EvolutionMetric {
  key?: string;
  label: string;
  current?: number;
  previous?: number;
  baseline?: number;
  target?: number;
  delta?: number;
  unit: string;
  direction?: string;
  status: string;
  statusLabel?: string;
  insight?: string;
}

export interface EvolutionReport {
  generatedAt?: string;
  hasMeasurements?: boolean;
  goal?: string;
  targetWeightKg?: number;
  headline?: string;
  weekAdherencePercent?: number;
  currentStreak?: number;
  excellentCount?: number;
  goodCount?: number;
  okCount?: number;
  belowCount?: number;
  metrics: EvolutionMetric[];
  history: BodyMeasurement[];
  /** @deprecated use history — kept for older API mappings */
  measurementHistory?: BodyMeasurement[];
}

export interface OnboardingActivityDraft {
  sportType: string;
  label: string;
  customLabel?: string;
  daysPerWeek: number;
  minutesPerSession: number;
}

export interface OnboardingDraft {
  agentPersona: string;
  athleteModeEnabled: boolean;
  activities: OnboardingActivityDraft[];
  foodLikes: string;
  foodDislikes: string;
  mealNotes: string;
  foodBudgetLevel: string;
  age: number;
  sex: string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  goal: string;
  activityLevel: string;
  dietaryPreference: string;
  restriction: string;
  healthConditions: string;
  medications: string;
  allergies: string;
  healthNotes: string;
  wakeTime: string;
  sleepTime: string;
}

export interface NutritionistPublic {
  id: number;
  name: string;
  crn: string;
  bio: string;
  specialties: string;
  consultationPriceCents: number;
  careDurationDays: number;
  photoThumbnailUrl?: string;
  serviceModes: string[];
  city?: string;
  stateCode?: string;
  locationLabel?: string;
}

export interface CareRelationship {
  id: number;
  patientId: number;
  patientName: string;
  nutritionistId: number;
  nutritionistName: string;
  status: string;
  source: string;
  startedAt?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface ProDashboard {
  activePatients: number;
  preEngagedPatients: number;
  pendingPaymentPatients: number;
  monthlyConsultations: number;
  monthlyGrossCents: number;
  monthlyNetCents: number;
  recentPatients: CareRelationship[];
}

export interface PatientDossier {
  patientId: number;
  patientName: string;
  care: CareRelationship;
  profile?: NutritionProfile;
  measurements: BodyMeasurement[];
  latestMealPlan?: MealPlan;
  checkinStats?: CheckinStats;
}

export interface ConversationMessage {
  id: number;
  senderRole: string;
  body: string;
  sentAt: string;
}

export interface Conversation {
  threadId: number;
  careRelationshipId: number;
  participantName: string;
  care: CareRelationship;
  messages: ConversationMessage[];
}

export interface ProInvite {
  code: string;
  inviteUrl: string;
  maxUses?: number;
  useCount: number;
  expiresAt?: string;
  createdAt?: string;
}

export function userHasAcceptedLegal(user: User): boolean {
  return Boolean(user.termsAcceptedAt && user.privacyPolicyAcceptedAt);
}

export function agentDisplayName(persona: string): string {
  return persona === 'BRUNO' ? 'Bruno' : 'Luna';
}

export function profileTypeLabel(profile: Pick<NutritionProfile, 'athleteModeEnabled'>): string {
  return profile.athleteModeEnabled ? 'Perfil atleta' : 'Perfil normal';
}

export const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Café da manhã',
  MORNING_SNACK: 'Lanche da manhã',
  LUNCH: 'Almoço',
  AFTERNOON_SNACK: 'Lanche da tarde',
  DINNER: 'Jantar',
  SUPPER: 'Ceia',
};

export const TREND_LABELS: Record<string, string> = {
  FAT_LOSS: 'Indício sugerido: menos gordura',
  FAT_GAIN: 'Indício sugerido: mais gordura',
  MUSCLE_GAIN: 'Indício sugerido: mais músculo',
  RECOMPOSITION: 'Indício sugerido: recomposição',
  MAINTENANCE: 'Medidas estáveis no período',
  PLATEAU: 'Medidas estáveis no período',
  INSUFFICIENT_DATA: 'Dados insuficientes para estimativa',
};

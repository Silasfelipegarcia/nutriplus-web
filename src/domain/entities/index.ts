export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
  photoThumbnailUrl?: string;
  cpfMasked?: string;
  hasNutritionProfile: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
  privacyPolicyAcceptedAt?: string;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  loginEnabled: boolean;
  message: string;
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
  birthDate?: string;
  city?: string;
  stateCode?: string;
  lifeStage?: string;
  chewingDifficulty?: string;
  seniorWeightLossAck?: boolean;
  goalTargetWeeks?: number;
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
  eatsBreakfast?: boolean;
  eatsLunch?: boolean;
  eatsAfternoonSnack?: boolean;
  eatsDinner?: boolean;
  openToRoutineAdjustment?: boolean;
  freeExtras?: string[];
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
  mealCalories?: number;
}

export interface DailyFoodExtraItem {
  id: number;
  description: string;
  estimatedCalories: number;
  impactMessage?: string;
}

export interface TodayCheckins {
  meals: TodayMealCheckin[];
  completedCount: number;
  totalCount: number;
  targetCalories?: number;
  consumedCalories?: number;
  extraCalories?: number;
  totalIntakeCalories?: number;
  remainingCalories?: number;
  goal?: string;
  extras?: DailyFoodExtraItem[];
}

export interface CheckinStats {
  currentStreak: number;
  weekAdherencePercent: number;
}

export interface PlanAdherenceProjection {
  averageDailyCalorieDelta: number;
  estimatedWeightChangeKgPerWeek?: number;
  summary: string;
}

export interface DailyAdherencePoint {
  date: string;
  mealsCompleted: number;
  mealsSkipped: number;
  mealsTotal: number;
  adherencePercent: number;
  consumedCalories: number;
  extraCalories: number;
  totalIntakeCalories: number;
  targetCalories?: number;
  dayStatus: string;
  extras: DailyFoodExtraItem[];
}

export interface PlanAdherenceHistory {
  windowDays: number;
  overallAdherencePercent: number;
  streakDays: number;
  targetCalories?: number;
  goal: string;
  daily: DailyAdherencePoint[];
  projection: PlanAdherenceProjection;
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
  customLabel?: string;
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
  eatsBreakfast: boolean;
  eatsLunch: boolean;
  eatsAfternoonSnack: boolean;
  eatsDinner: boolean;
  openToRoutineAdjustment: boolean;
  freeExtras: string[];
  foodBudgetLevel: string;
  age: number;
  birthDate: string;
  city: string;
  stateCode: string;
  chewingDifficulty: string;
  seniorWeightLossAck: boolean;
  goalTargetWeeks: number;
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
  crnVerified: boolean;
  bio: string;
  specialties: string;
  consultationPriceCents: number;
  careDurationDays: number;
  photoThumbnailUrl?: string;
  serviceModes: string[];
  city?: string;
  stateCode?: string;
  locationLabel?: string;
  whatsappPhone?: string;
  averageRating: number;
  ratingCount: number;
}

export interface CareRating {
  id: number;
  careRelationshipId: number;
  stars: number;
  comment?: string;
  patientName?: string;
  createdAt?: string;
}

export interface NutritionistRatingsSummary {
  averageStars: number;
  totalRatings: number;
  recent: CareRating[];
}

export interface ProProfileUpdate {
  bio?: string;
  specialties?: string;
  marketplaceVisible?: boolean;
  serviceModes?: string[];
  city?: string;
  stateCode?: string;
  neighborhood?: string;
  whatsappPhone?: string;
}

export interface ProPricingUpdate {
  consultationPriceCents: number;
  careDurationDays?: number;
}

export interface ProPatientNutritionUpdate {
  goal?: string;
  dietaryPreference?: string;
  restriction?: string;
  agentPersona?: string;
  mealNotes?: string;
  healthNotes?: string;
}

export interface StripeConnectResult {
  onboardingUrl: string;
  onboardingComplete: boolean;
  stripeAccountId?: string;
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
  patientEmail?: string;
  patientPhotoThumbnailUrl?: string;
  patientBirthDate?: string;
  cpfMasked?: string;
  care: CareRelationship;
  profile?: NutritionProfile;
  measurements: BodyMeasurement[];
  evolution?: EvolutionReport;
  latestMealPlan?: MealPlan;
  latestProgressReview?: ProgressReview;
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

export function lifeStageLabel(lifeStage?: string): string {
  switch (lifeStage) {
    case 'SENIOR':
      return 'Idoso (65+)';
    case 'PRE_SENIOR':
      return 'Pré-idoso (60–64)';
    case 'ADULT':
      return 'Adulto';
    default:
      return lifeStage ?? '—';
  }
}

export function isSeniorLifeStage(lifeStage?: string): boolean {
  return lifeStage === 'SENIOR' || lifeStage === 'PRE_SENIOR';
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

import {
  NutritionProfile,
  ShoppingList,
} from '../../domain/entities';

export interface BudgetReference {
  weeklyMinCents: number;
  weeklyMaxCents: number;
  weeklyMidCents: number;
  label: string;
}

export interface SwapSavingsLine {
  itemName: string;
  selectedLabel: string;
  savingsCents: number;
  applied: boolean;
}

export interface ShoppingFinanceSnapshot {
  budgetLevel: string;
  budgetReference: BudgetReference;
  budgetSummary?: string;
  weeklyImpactSummary?: string;
  appliedSavingsCents: number;
  potentialSavingsCents: number;
  smartSwapCount: number;
  pendingSwapCount: number;
  swapLines: SwapSavingsLine[];
  weekStart?: string;
  weekEnd?: string;
  adjustedWeeklyMidCents: number;
  adjustedMonthlyCents: number;
  adjustedYearlyCents: number;
  projectedYearlySavingsCents: number;
}

const BUDGET_REFERENCES: Record<string, Omit<BudgetReference, 'weeklyMidCents'>> = {
  ECONOMIC: { weeklyMinCents: 12000, weeklyMaxCents: 16000, label: 'Econômico' },
  MODERATE: { weeklyMinCents: 18000, weeklyMaxCents: 24000, label: 'Moderado' },
  FLEXIBLE: { weeklyMinCents: 28000, weeklyMaxCents: 38000, label: 'Flexível' },
};

const BUDGET_LABELS: Record<string, string> = {
  ECONOMIC: 'Econômico',
  MODERATE: 'Moderado',
  FLEXIBLE: 'Flexível',
};

function budgetReferenceFor(level?: string): BudgetReference {
  const ref = BUDGET_REFERENCES[level ?? 'MODERATE'] ?? BUDGET_REFERENCES['MODERATE'];
  return {
    ...ref,
    weeklyMidCents: Math.round((ref.weeklyMinCents + ref.weeklyMaxCents) / 2),
  };
}

function tierRank(tier: string): number {
  switch (tier.toUpperCase()) {
    case 'ECONOMIC':
      return 0;
    case 'MODERATE':
      return 1;
    case 'PREMIUM':
      return 2;
    default:
      return 1;
  }
}

function savingsBetweenTiers(fromTier: string, toTier: string): number {
  const diff = tierRank(fromTier) - tierRank(toTier);
  if (diff <= 0) return 0;
  return diff * 1200;
}

function findOption(options: ShoppingSwapOption[] | undefined, id?: string): ShoppingSwapOption | undefined {
  if (!options?.length || !id) return undefined;
  return options.find((opt) => opt.id === id);
}

export function buildShoppingFinanceSnapshot(input: {
  foodBudgetLevel?: string;
  list?: ShoppingList | null;
}): ShoppingFinanceSnapshot {
  const level = input.foodBudgetLevel ?? 'MODERATE';
  const reference = budgetReferenceFor(level);
  const budgetLevel = BUDGET_LABELS[level] ?? reference.label;

  if (!input.list) {
    return emptySnapshot(budgetLevel, reference);
  }

  let appliedSavings = 0;
  let potentialSavings = 0;
  let smartSwaps = 0;
  let pendingSwaps = 0;
  const lines: SwapSavingsLine[] = [];

  for (const item of input.list.items) {
    if (!item.swapOptions || item.swapOptions.length < 2) continue;

    const defaultOpt = findOption(item.swapOptions, item.defaultOptionId) ?? item.swapOptions[0];
    const recommendedOpt = findOption(item.swapOptions, item.recommendedOptionId) ?? defaultOpt;
    const selectedId = item.selectedSwapId ?? item.defaultOptionId;
    const selectedOpt = findOption(item.swapOptions, selectedId) ?? defaultOpt;

    const defaultSavings = savingsBetweenTiers(defaultOpt.costTier, recommendedOpt.costTier);
    if (defaultSavings <= 0) continue;

    const selectedSavings = savingsBetweenTiers(defaultOpt.costTier, selectedOpt.costTier);
    if (selectedSavings > 0) {
      appliedSavings += selectedSavings;
      smartSwaps += 1;
      lines.push({
        itemName: item.itemName,
        selectedLabel: selectedOpt.label,
        savingsCents: selectedSavings,
        applied: true,
      });
    } else if (defaultSavings > 0) {
      pendingSwaps += 1;
      potentialSavings += defaultSavings;
      lines.push({
        itemName: item.itemName,
        selectedLabel: recommendedOpt.label,
        savingsCents: defaultSavings,
        applied: false,
      });
    }
  }

  lines.sort((a, b) => b.savingsCents - a.savingsCents);

  const adjustedWeeklyMidCents = Math.max(0, Math.min(reference.weeklyMaxCents, reference.weeklyMidCents - appliedSavings));

  return {
    budgetLevel,
    budgetReference: reference,
    budgetSummary: input.list.guidance?.budgetSummary,
    weeklyImpactSummary: input.list.guidance?.weeklyImpactSummary,
    appliedSavingsCents: appliedSavings,
    potentialSavingsCents: potentialSavings,
    smartSwapCount: smartSwaps,
    pendingSwapCount: pendingSwaps,
    swapLines: lines.slice(0, 6),
    weekStart: input.list.weekStart,
    weekEnd: input.list.weekEnd,
    adjustedWeeklyMidCents,
    adjustedMonthlyCents: adjustedWeeklyMidCents * 4,
    adjustedYearlyCents: adjustedWeeklyMidCents * 52,
    projectedYearlySavingsCents: appliedSavings * 52,
  };
}

function emptySnapshot(budgetLevel: string, reference: BudgetReference): ShoppingFinanceSnapshot {
  return {
    budgetLevel,
    budgetReference: reference,
    appliedSavingsCents: 0,
    potentialSavingsCents: 0,
    smartSwapCount: 0,
    pendingSwapCount: 0,
    swapLines: [],
    adjustedWeeklyMidCents: reference.weeklyMidCents,
    adjustedMonthlyCents: reference.weeklyMidCents * 4,
    adjustedYearlyCents: reference.weeklyMidCents * 52,
    projectedYearlySavingsCents: 0,
  };
}

export function formatBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function formatBrlRange(minCents: number, maxCents: number): string {
  return `${formatBrl(minCents)} – ${formatBrl(maxCents)}`;
}

export function budgetLabelFromProfile(profile?: NutritionProfile | null): string {
  if (!profile?.foodBudgetLevel) return 'Moderado';
  return BUDGET_LABELS[profile.foodBudgetLevel] ?? 'Moderado';
}

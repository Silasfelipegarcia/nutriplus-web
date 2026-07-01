import { MealItem } from '../../domain/entities';

interface UnitRule {
  keywords: string[];
  unitKind: string;
  gramsPerUnit: number;
  singular: string;
  plural: string;
}

const UNIT_RULES: UnitRule[] = [
  { keywords: ['ovo', 'ovos'], unitKind: 'unit', gramsPerUnit: 60, singular: 'ovo', plural: 'ovos' },
  { keywords: ['banana'], unitKind: 'unit', gramsPerUnit: 100, singular: 'banana', plural: 'bananas' },
  { keywords: ['maçã', 'maca'], unitKind: 'unit', gramsPerUnit: 130, singular: 'maçã', plural: 'maçãs' },
  { keywords: ['pera'], unitKind: 'unit', gramsPerUnit: 150, singular: 'pera', plural: 'peras' },
  { keywords: ['laranja'], unitKind: 'unit', gramsPerUnit: 180, singular: 'laranja', plural: 'laranjas' },
  {
    keywords: ['tangerina', 'mexerica'],
    unitKind: 'unit',
    gramsPerUnit: 130,
    singular: 'tangerina',
    plural: 'tangerinas',
  },
  { keywords: ['iogurte'], unitKind: 'unit', gramsPerUnit: 170, singular: 'pote', plural: 'potes' },
  {
    keywords: ['pão', 'pao', 'torrada', 'bisnaga'],
    unitKind: 'slice',
    gramsPerUnit: 30,
    singular: 'fatia',
    plural: 'fatias',
  },
  {
    keywords: ['queijo', 'presunto', 'mussarela'],
    unitKind: 'slice',
    gramsPerUnit: 25,
    singular: 'fatia',
    plural: 'fatias',
  },
  {
    keywords: ['azeite'],
    unitKind: 'tablespoon',
    gramsPerUnit: 15,
    singular: 'colher de sopa',
    plural: 'colheres de sopa',
  },
];

function matchRule(foodName: string): UnitRule | undefined {
  const lower = foodName.toLowerCase();
  return UNIT_RULES.find((rule) => rule.keywords.some((keyword) => lower.includes(keyword)));
}

function roundCount(value: number): number {
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) <= 0.35) return rounded < 1 ? 1 : rounded;
  if (value >= 0.4 && value <= 0.65) return 0.5;
  const fallback = Math.round(value);
  return fallback < 1 ? 1 : fallback;
}

export function inferQuantityDisplay(foodName: string, quantityG: number): string {
  if (quantityG <= 0) return '—';

  const rule = matchRule(foodName);
  if (!rule) return `${Math.round(quantityG)} g`;

  const countRaw = quantityG / rule.gramsPerUnit;
  const count = roundCount(countRaw);

  if (count === 0.5) return `½ ${rule.singular}`;
  const label = count === 1 ? rule.singular : rule.plural;
  return `${count} ${label}`;
}

export function formatMealItemQuantity(item: MealItem): string {
  const stored = item.quantityDisplay?.trim();
  if (stored) return stored;
  return inferQuantityDisplay(item.foodName, item.quantityG);
}

export function formatMealItemLine(item: MealItem): string {
  return `${item.foodName} — ${formatMealItemQuantity(item)}`;
}

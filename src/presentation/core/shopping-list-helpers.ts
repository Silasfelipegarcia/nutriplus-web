import { ShoppingListItem } from '../../domain/entities';

export function shoppingItemListSubtitle(item: ShoppingListItem): string {
  const parts: string[] = [];
  if (item.proteinLeanness) parts.push(item.proteinLeanness);
  if (item.kcalEstimate != null) parts.push(`~${item.kcalEstimate} kcal/100g`);
  if (parts.length === 0 && item.explanation?.trim()) {
    const text = item.explanation.trim();
    parts.push(text.length <= 60 ? text : `${text.slice(0, 57)}...`);
  } else if (parts.length === 0 && item.category?.trim()) {
    parts.push(item.category);
  }
  if (parts.length === 0) return 'Clique para ver detalhes';
  return parts.join(' · ');
}

export function shoppingItemHasSwapChoices(item: ShoppingListItem): boolean {
  return (item.swapOptions?.length ?? 0) >= 2;
}

export function shoppingItemHasDetailContent(item: ShoppingListItem): boolean {
  return (
    item.kcalEstimate != null ||
    !!item.proteinLeanness ||
    !!item.explanation?.trim() ||
    (item.alternatives?.length ?? 0) > 0 ||
    (item.swapOptions?.length ?? 0) > 0 ||
    (item.marketTips?.length ?? 0) > 0
  );
}

export function formatShoppingWeekPeriod(weekStart?: string, weekEnd?: string): string | null {
  if (!weekStart || !weekEnd) return null;
  return `${formatIsoDate(weekStart)} – ${formatIsoDate(weekEnd)}`;
}

export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

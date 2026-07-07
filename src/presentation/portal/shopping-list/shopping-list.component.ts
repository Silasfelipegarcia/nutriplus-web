import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NutriEmptyStateComponent } from '../../../design-system/nutri-empty-state/nutri-empty-state.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { HOUSEHOLD_REPOSITORY } from '../../../domain/repositories/household.repository';
import { ShoppingList, ShoppingListItem } from '../../../domain/entities';
import { AggregatedShoppingItem } from '../../../domain/entities/household.model';
import { isNotFound } from '../../../infrastructure/http/api-error';
import { PortalPageSkeletonComponent } from '../portal-page-skeleton.component';
import { PortalDataStore } from '../../core/portal-data.store';
import {
  buildShoppingFinanceSnapshot,
  formatBrl,
  formatBrlRange,
  ShoppingFinanceSnapshot,
} from '../../core/shopping-finance';
import {
  formatShoppingWeekPeriod,
  shoppingItemHasSwapChoices,
  shoppingItemListSubtitle,
} from '../../core/shopping-list-helpers';
import { ShoppingItemDetailComponent } from './shopping-item-detail.component';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [NutriEmptyStateComponent, PortalPageSkeletonComponent, ShoppingItemDetailComponent],
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss', '../portal.scss'],
})
export class ShoppingListComponent implements OnInit {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly householdRepo = inject(HOUSEHOLD_REPOSITORY);
  private readonly portalData = inject(PortalDataStore);

  readonly shoppingItemListSubtitle = shoppingItemListSubtitle;
  readonly shoppingItemHasSwapChoices = shoppingItemHasSwapChoices;
  readonly formatBrl = formatBrl;
  readonly formatBrlRange = formatBrlRange;

  readonly list = signal<ShoppingList | null>(null);
  readonly finance = signal<ShoppingFinanceSnapshot | null>(null);
  readonly familyList = signal<AggregatedShoppingItem[] | null>(null);
  readonly familyMode = signal(false);
  readonly loading = signal(true);
  readonly groupedItems = signal<{ category: string; items: ShoppingList['items'] }[]>([]);
  readonly itemSelecionado = signal<ShoppingListItem | null>(null);
  readonly dicaAberta = signal<{ title: string; description: string } | null>(null);

  readonly weekPeriodLabel = computed(() => {
    const current = this.list();
    const label = formatShoppingWeekPeriod(current?.weekStart, current?.weekEnd);
    return label ? `Período: ${label}` : null;
  });

  async ngOnInit(): Promise<void> {
    await this.loadList();
  }

  async toggleFamilyMode(enabled: boolean): Promise<void> {
    this.familyMode.set(enabled);
    await this.loadList();
  }

  private async loadList(): Promise<void> {
    this.loading.set(true);
    try {
      await this.portalData.loadNutritionProfile(false);
      const profile = this.portalData.nutritionProfile();
      const list = await this.nutritionRepo.getLatestShoppingList();
      this.list.set(list);
      this.finance.set(
        buildShoppingFinanceSnapshot({
          foodBudgetLevel: profile?.foodBudgetLevel,
          list,
        }),
      );
      this.groupedItems.set(this.agruparPorCategoria(list.items));
      if (this.familyMode()) {
        try {
          const family = await this.householdRepo.getAggregatedShoppingList();
          this.familyList.set(family.items);
        } catch (e) {
          if (!isNotFound(e)) throw e;
          this.familyList.set(null);
          this.familyMode.set(false);
        }
      } else {
        this.familyList.set(null);
      }
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
    this.loading.set(false);
  }

  abrirDetalhe(item: ShoppingListItem): void {
    this.itemSelecionado.set(item);
  }

  private agruparPorCategoria(items: ShoppingListItem[]): { category: string; items: ShoppingListItem[] }[] {
    const map = new Map<string, ShoppingListItem[]>();
    for (const item of items) {
      const cat = item.category?.trim() || 'Outros';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return [...map.entries()].map(([category, groupItems]) => ({ category, items: groupItems }));
  }
}

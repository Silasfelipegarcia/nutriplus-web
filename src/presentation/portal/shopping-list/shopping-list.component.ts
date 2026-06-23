import { Component, inject, OnInit, signal } from '@angular/core';
import { NutriEmptyStateComponent } from '../../../design-system/nutri-empty-state/nutri-empty-state.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { ShoppingList } from '../../../domain/entities';
import { isNotFound } from '../../../infrastructure/http/api-error';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [NutriEmptyStateComponent],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Lista de compras</h1>
        <p>Itens da semana baseados no seu plano alimentar.</p>
      </div>

    @if (list()) {
      @for (group of groupedItems(); track group.category) {
        <div class="shopping-category">
          <h3>{{ group.category }}</h3>
          @for (item of group.items; track item.itemName) {
            <div class="meal-item-row">
              <span>{{ item.itemName }}</span>
              <span>{{ item.quantity }}</span>
            </div>
          }
        </div>
      }
    } @else if (!loading()) {
      <nutri-empty-state icon="🛒" title="Lista vazia" message="Gere um plano alimentar para criar sua lista de compras." />
    }

    @if (loading()) {
      <p class="loading-text">Carregando...</p>
    }
    </div>
  `,
  styleUrl: '../portal.scss',
})
export class ShoppingListComponent implements OnInit {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);

  readonly list = signal<ShoppingList | null>(null);
  readonly loading = signal(true);

  groupedItems = signal<{ category: string; items: ShoppingList['items'] }[]>([]);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.nutritionRepo.getLatestShoppingList();
      this.list.set(list);
      const map = new Map<string, ShoppingList['items']>();
      for (const item of list.items) {
        const cat = item.category ?? 'Outros';
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push(item);
      }
      this.groupedItems.set([...map.entries()].map(([category, items]) => ({ category, items })));
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
    this.loading.set(false);
  }
}

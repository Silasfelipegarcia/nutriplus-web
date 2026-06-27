import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NutriInfoTipComponent } from '../nutri-info-tip/nutri-info-tip.component';
import {
  DEFAULT_FREE_EXTRA_SUGGESTIONS,
  MEAL_ROUTINE_SLOTS,
  MealRoutineState,
  hasAnyMealRoutine,
} from '../../presentation/core/meal-routine';

@Component({
  selector: 'nutri-meal-routine-picker',
  standalone: true,
  imports: [FormsModule, NutriInfoTipComponent],
  template: `
    <section class="meal-routine">
      <h2 class="meal-routine__title">Como você come hoje?</h2>
      <p class="meal-routine__lead">
        Marque as refeições que faz no dia a dia. O plano encaixa na sua rotina — sem horários rígidos.
      </p>

      @for (slot of slots; track slot.field) {
        <label class="meal-routine__row">
          <div>
            <span class="meal-routine__label">{{ slot.label }}</span>
            <span class="meal-routine__subtitle">{{ slot.subtitle }}</span>
          </div>
          <input
            type="checkbox"
            [checked]="value()[slot.field]"
            (change)="toggleMeal(slot.field, $any($event.target).checked)"
          />
        </label>
      }

      @if (!hasAnyMeal()) {
        <nutri-info-tip message="Selecione pelo menos uma refeição da sua rotina." />
      }

      <label class="meal-routine__row meal-routine__row--adjust">
        <div>
          <span class="meal-routine__label">Aberto a ajustes leves na rotina</span>
          <span class="meal-routine__subtitle">
            O plano pode sugerir um lanche extra ou remanejar horários — sempre com opção de manter como você já come.
          </span>
        </div>
        <input
          type="checkbox"
          [checked]="value().openToRoutineAdjustment"
          (change)="patch({ openToRoutineAdjustment: $any($event.target).checked })"
        />
      </label>

      <div class="meal-routine__extras">
        <h3 class="meal-routine__extras-title">Extras liberados (sem culpa)</h3>
        <p class="meal-routine__subtitle">
          Coisas leves que você gosta — salada, café preto, caldo…
        </p>
        <div class="meal-routine__chips">
          @for (suggestion of extraSuggestions; track suggestion) {
            <button
              type="button"
              class="meal-routine__chip"
              [class.meal-routine__chip--selected]="value().freeExtras.includes(suggestion)"
              (click)="toggleExtra(suggestion)"
            >
              {{ suggestion }}
            </button>
          }
          @for (extra of customExtras(); track extra) {
            <button type="button" class="meal-routine__chip meal-routine__chip--selected" (click)="removeExtra(extra)">
              {{ extra }} ×
            </button>
          }
        </div>
        <div class="meal-routine__extra-input">
          <input
            type="text"
            [(ngModel)]="extraDraft"
            name="mealExtraDraft"
            placeholder="Outro extra (Ex.: pepino, chá verde)"
            (keydown.enter)="addExtraFromDraft($event)"
          />
          <button type="button" class="meal-routine__add" (click)="addExtraFromDraft()">Adicionar</button>
        </div>
      </div>
    </section>
  `,
  styles: `
    .meal-routine {
      display: grid;
      gap: 0.75rem;
    }

    .meal-routine__title {
      margin: 0;
      font-size: 1.05rem;
    }

    .meal-routine__lead {
      margin: 0;
      font-size: 0.9rem;
      color: var(--nutri-ink-muted);
      line-height: 1.4;
    }

    .meal-routine__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.65rem 0;
      border-bottom: 1px solid var(--nutri-border, #e8e8e8);
      cursor: pointer;
    }

    .meal-routine__row--adjust {
      margin-top: 0.5rem;
      border-bottom: none;
    }

    .meal-routine__label {
      display: block;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .meal-routine__subtitle {
      display: block;
      margin-top: 0.15rem;
      font-size: 0.82rem;
      color: var(--nutri-ink-muted);
      line-height: 1.35;
    }

    .meal-routine__row input[type='checkbox'] {
      width: 1.1rem;
      height: 1.1rem;
      accent-color: var(--nutri-brand);
      flex-shrink: 0;
    }

    .meal-routine__extras {
      margin-top: 0.5rem;
      display: grid;
      gap: 0.5rem;
    }

    .meal-routine__extras-title {
      margin: 0;
      font-size: 0.95rem;
    }

    .meal-routine__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .meal-routine__chip {
      border: 1px solid var(--nutri-border, #ddd);
      background: #fff;
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .meal-routine__chip--selected {
      background: color-mix(in srgb, var(--nutri-brand) 12%, white);
      border-color: var(--nutri-brand);
      color: var(--nutri-brand-strong, var(--nutri-brand));
    }

    .meal-routine__extra-input {
      display: flex;
      gap: 0.5rem;
    }

    .meal-routine__extra-input input {
      flex: 1;
      border: 1px solid var(--nutri-border, #ddd);
      border-radius: 8px;
      padding: 0.55rem 0.75rem;
      font-size: 0.9rem;
    }

    .meal-routine__add {
      border: none;
      background: var(--nutri-brand);
      color: #fff;
      border-radius: 8px;
      padding: 0 1rem;
      font-size: 0.85rem;
      cursor: pointer;
      white-space: nowrap;
    }
  `,
})
export class NutriMealRoutinePickerComponent {
  readonly value = input.required<MealRoutineState>();
  readonly valueChange = output<MealRoutineState>();

  readonly slots = MEAL_ROUTINE_SLOTS;
  readonly extraSuggestions = DEFAULT_FREE_EXTRA_SUGGESTIONS;

  extraDraft = '';

  hasAnyMeal(): boolean {
    return hasAnyMealRoutine(this.value());
  }

  customExtras(): string[] {
    return this.value().freeExtras.filter((e) => !this.extraSuggestions.includes(e));
  }

  toggleMeal(field: keyof Pick<MealRoutineState, 'eatsBreakfast' | 'eatsLunch' | 'eatsAfternoonSnack' | 'eatsDinner'>, enabled: boolean): void {
    this.patch({ [field]: enabled });
  }

  patch(partial: Partial<MealRoutineState>): void {
    this.valueChange.emit({ ...this.value(), ...partial });
  }

  toggleExtra(label: string): void {
    const extras = this.value().freeExtras;
    if (extras.includes(label)) {
      this.patch({ freeExtras: extras.filter((e) => e !== label) });
      return;
    }
    this.patch({ freeExtras: [...extras, label] });
  }

  removeExtra(label: string): void {
    this.patch({ freeExtras: this.value().freeExtras.filter((e) => e !== label) });
  }

  addExtraFromDraft(event?: Event): void {
    event?.preventDefault();
    const trimmed = this.extraDraft.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (this.value().freeExtras.some((e) => e.toLowerCase() === lower)) {
      this.extraDraft = '';
      return;
    }
    this.patch({ freeExtras: [...this.value().freeExtras, trimmed] });
    this.extraDraft = '';
  }
}

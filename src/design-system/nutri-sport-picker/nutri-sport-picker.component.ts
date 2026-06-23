import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
  forwardRef,
  signal,
  computed,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SportCatalogItem } from '../../domain/entities';
import { SportSelection, otherSportCatalogItem } from '../../presentation/core/sport-catalog';

@Component({
  selector: 'nutri-sport-picker',
  standalone: true,
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NutriSportPickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="sport-picker">
      <input
        #inputEl
        class="sport-picker__input"
        type="text"
        [ngModel]="query()"
        (ngModelChange)="onQueryChange($event)"
        (focus)="open.set(true)"
        placeholder="Digite para buscar (ex.: corrida, natação...)"
        autocomplete="off"
        role="combobox"
        [attr.aria-expanded]="open()"
        aria-autocomplete="list"
      />
      @if (open() && (filtered().length || showCustomOption())) {
        <ul class="sport-picker__list" role="listbox">
          @for (s of filtered(); track s.sportType) {
            <li
              class="sport-picker__option"
              role="option"
              (mousedown)="pickSport($event, s)"
            >
              {{ s.label }}
              <small>{{ s.intensityHint }}</small>
            </li>
          }
          @if (showCustomOption()) {
            <li
              class="sport-picker__option sport-picker__option--custom"
              role="option"
              (mousedown)="pickCustom($event)"
            >
              Usar "{{ query().trim() }}" como esporte personalizado
            </li>
          }
        </ul>
      }
      @if (selection()) {
        <p class="sport-picker__hint">
          Selecionado: <strong>{{ displayLabel() }}</strong>
        </p>
      }
    </div>
  `,
  styleUrl: './nutri-sport-picker.component.scss',
})
export class NutriSportPickerComponent implements ControlValueAccessor {
  @Input({ required: true }) catalog: SportCatalogItem[] = [];
  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;

  readonly query = signal('');
  readonly open = signal(false);
  readonly selection = signal<SportSelection | null>(null);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.catalog;
    if (!q) return list.slice(0, 12);
    return list.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.sportType.toLowerCase().replaceAll('_', ' ').includes(q),
    );
  });

  readonly showCustomOption = computed(() => {
    const q = this.query().trim();
    if (q.length < 2) return false;
    const lower = q.toLowerCase();
    return !this.catalog.some((s) => s.label.toLowerCase() === lower);
  });

  private onChange: (value: SportSelection | null) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.inputEl?.nativeElement && !this.inputEl.nativeElement.parentElement?.contains(target)) {
      this.open.set(false);
    }
  }

  displayLabel(): string {
    const sel = this.selection();
    if (!sel) return '';
    return sel.customLabel?.trim() || sel.label;
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.open.set(true);
    if (!value.trim()) {
      this.selection.set(null);
      this.onChange(null);
    }
  }

  pickSport(event: MouseEvent, sport: SportCatalogItem): void {
    event.preventDefault();
    const sel: SportSelection = {
      sportType: sport.sportType,
      label: sport.label,
      met: sport.met,
    };
    this.applySelection(sel, sport.label);
  }

  pickCustom(event: MouseEvent): void {
    event.preventDefault();
    const custom = this.query().trim();
    const other = otherSportCatalogItem();
    const sel: SportSelection = {
      sportType: 'OTHER',
      label: other.label,
      customLabel: custom,
      met: other.met,
    };
    this.applySelection(sel, custom);
  }

  private applySelection(sel: SportSelection, display: string): void {
    this.selection.set(sel);
    this.query.set(display);
    this.open.set(false);
    this.onChange(sel);
    this.onTouched();
  }

  writeValue(value: SportSelection | null): void {
    this.selection.set(value);
    if (value) {
      this.query.set(value.customLabel?.trim() || value.label);
    } else {
      this.query.set('');
    }
  }

  registerOnChange(fn: (value: SportSelection | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(_isDisabled: boolean): void {
    // readonly for now
  }
}

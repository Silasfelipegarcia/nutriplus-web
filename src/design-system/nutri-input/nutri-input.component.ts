import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'nutri-input',
  standalone: true,
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NutriInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="nutri-input">
      @if (label) {
        <label [for]="resolvedInputId">{{ label }}</label>
      }
      @if (type === 'textarea') {
        <textarea
          [id]="resolvedInputId"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [(ngModel)]="value"
          (ngModelChange)="onChange($event)"
          (blur)="onTouched()"
        ></textarea>
      } @else {
        <input
          [id]="resolvedInputId"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [(ngModel)]="value"
          (ngModelChange)="onChange($event)"
          (blur)="onTouched()"
        />
      }
      @if (error) {
        <span class="nutri-input__error">{{ error }}</span>
      }
    </div>
  `,
  styleUrl: './nutri-input.component.scss',
})
export class NutriInputComponent implements ControlValueAccessor {
  private static nextId = 0;
  private cachedInputId: string | null = null;

  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' = 'text';
  @Input() placeholder = '';
  @Input() error = '';
  @Input() inputId = '';

  get resolvedInputId(): string {
    if (this.cachedInputId) {
      return this.cachedInputId;
    }

    if (this.inputId.trim()) {
      this.cachedInputId = this.inputId.trim();
      return this.cachedInputId;
    }

    if (this.label.trim()) {
      this.cachedInputId = `nutri-input-${this.label
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`;
      return this.cachedInputId;
    }

    NutriInputComponent.nextId += 1;
    this.cachedInputId = `nutri-input-${NutriInputComponent.nextId}`;
    return this.cachedInputId;
  }

  value = '';
  disabled = false;
  onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: string): void {
    this.value = v ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

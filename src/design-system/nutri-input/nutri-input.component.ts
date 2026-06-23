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
        <label [for]="inputId">{{ label }}</label>
      }
      @if (type === 'textarea') {
        <textarea
          [id]="inputId"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [(ngModel)]="value"
          (ngModelChange)="onChange($event)"
          (blur)="onTouched()"
        ></textarea>
      } @else {
        <input
          [id]="inputId"
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
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'textarea' = 'text';
  @Input() placeholder = '';
  @Input() error = '';
  @Input() inputId = `nutri-input-${Math.random().toString(36).slice(2, 9)}`;

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

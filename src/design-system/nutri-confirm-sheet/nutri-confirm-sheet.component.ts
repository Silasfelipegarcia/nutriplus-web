import { Component, HostListener, effect, input, output, signal } from '@angular/core';
import { NutriButtonComponent } from '../nutri-button/nutri-button.component';

@Component({
  selector: 'nutri-confirm-sheet',
  standalone: true,
  imports: [NutriButtonComponent],
  templateUrl: './nutri-confirm-sheet.component.html',
  styleUrl: './nutri-confirm-sheet.component.scss',
})
export class NutriConfirmSheetComponent {
  readonly open = input(false);
  readonly title = input('Tem certeza?');
  readonly message = input('');
  readonly confirmLabel = input('Sim, confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly processing = input(false);
  readonly requireCheckbox = input(true);
  readonly checkboxLabel = input('Tenho certeza e desejo continuar');
  readonly typedConfirmPhrase = input<string | null>(null);
  readonly typedConfirmLabel = input('Digite para confirmar');

  readonly confirmed = output<void>();
  readonly dismissed = output<void>();

  readonly checked = signal(false);
  readonly typedConfirmValue = signal('');

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.checked.set(false);
        this.typedConfirmValue.set('');
      }
    });
  }

  podeConfirmar(): boolean {
    if (this.processing()) return false;
    if (this.requireCheckbox() && !this.checked()) return false;
    const phrase = this.typedConfirmPhrase()?.trim();
    if (phrase) {
      return this.typedConfirmValue().trim() === phrase;
    }
    return true;
  }

  onDismiss(): void {
    if (this.processing()) return;
    this.checked.set(false);
    this.dismissed.emit();
  }

  onConfirm(): void {
    if (!this.podeConfirmar()) return;
    this.confirmed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.onDismiss();
    }
  }
}

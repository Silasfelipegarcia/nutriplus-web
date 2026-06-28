import { Component, OnInit, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { PaymentService } from '../../../infrastructure/http/payment.service';
import { cpfDigitsOnly, formatCpfInput, isValidCpf } from '../../core/date.util';
import { SavedCard } from '../../../domain/entities/payment.model';

@Component({
  selector: 'app-card-register',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (carregando()) {
      <p>Carregando formulário...</p>
    } @else if (erro()) {
      <p class="erro">{{ erro() }}</p>
    } @else {
      <form class="card-form" (ngSubmit)="salvar()">
        <label>CPF<input [(ngModel)]="cpf" name="cpf" placeholder="000.000.000-00" (input)="onCpfInput($event)" required /></label>
        <label>Nome no cartão<input [(ngModel)]="cardholderName" name="name" required /></label>
        <label>Número<input [(ngModel)]="cardNumber" name="number" (input)="onCardNumberInput($event)" required /></label>
        <label>Validade (MM/AA)<input [(ngModel)]="expiration" name="exp" (input)="onExpirationInput($event)" required /></label>
        <label>CVV<input [(ngModel)]="securityCode" name="cvv" type="password" maxlength="4" required /></label>
        <button type="submit" [disabled]="salvando()">{{ salvando() ? 'Salvando...' : 'Salvar cartão' }}</button>
      </form>
    }
  `,
  styles: [`
    .card-form { display: flex; flex-direction: column; gap: 0.75rem; max-width: 24rem; }
    .erro { color: #b91c1c; }
  `],
})
export class CardRegisterComponent implements OnInit {
  readonly cardSaved = output<SavedCard>();

  private readonly payment = inject(PaymentService);

  carregando = signal(true);
  salvando = signal(false);
  erro = signal('');

  cpf = '';
  cardNumber = '';
  cardholderName = '';
  expiration = '';
  securityCode = '';

  private mp: import('../../../types/mercadopago').MercadoPagoInstance | null = null;

  ngOnInit(): void {
    this.payment.obterConfig().subscribe({
      next: async (config) => {
        if (!config.configured || !config.publicKey) {
          this.erro.set('Pagamentos não configurados na API.');
          this.carregando.set(false);
          return;
        }
        try {
          await loadMercadoPago();
          this.mp = new window.MercadoPago(config.publicKey, { locale: 'pt-BR' });
        } catch {
          this.erro.set('Não foi possível carregar o Mercado Pago.');
        }
        this.carregando.set(false);
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.carregando.set(false);
      },
    });
  }

  async salvar(): Promise<void> {
    if (!this.mp || this.salvando()) return;

    const digits = this.cardNumber.replace(/\D/g, '');
    const [month, yearShort] = this.expiration.split('/').map((p) => p.trim());
    const year = yearShort?.length === 2 ? `20${yearShort}` : yearShort;
    const cpf = cpfDigitsOnly(this.cpf);
    if (!isValidCpf(this.cpf)) {
      this.erro.set('Informe um CPF válido.');
      return;
    }

    this.salvando.set(true);
    this.erro.set('');

    try {
      const tokenResult = await this.mp.createCardToken({
        cardNumber: digits,
        cardholderName: this.cardholderName.trim(),
        cardExpirationMonth: month.padStart(2, '0'),
        cardExpirationYear: year,
        securityCode: this.securityCode,
        identificationType: 'CPF',
        identificationNumber: cpf,
      });

      const tokenId = tokenResult?.id;
      if (!tokenId) throw new Error('Não foi possível validar o cartão.');

      this.payment.salvarCartao(tokenId).subscribe({
        next: (card) => {
          this.salvando.set(false);
          this.cardSaved.emit(card);
        },
        error: (msg: string) => {
          this.erro.set(msg);
          this.salvando.set(false);
        },
      });
    } catch (e: unknown) {
      this.erro.set(e instanceof Error ? e.message : 'Erro ao tokenizar cartão');
      this.salvando.set(false);
    }
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 16);
    digits = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    this.cardNumber = digits;
    input.value = digits;
  }

  onExpirationInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) digits = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    this.expiration = digits;
    input.value = digits;
  }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.cpf = formatCpfInput(input.value);
    input.value = this.cpf;
  }
}

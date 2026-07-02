import { Component, OnInit, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { environment } from '../../../environments/environment';
import { createMercadoPagoCardToken } from '../../../infrastructure/payment/mercado-pago-card-tokenizer';
import { PaymentService } from '../../../infrastructure/http/payment.service';
import { cpfDigitsOnly, formatCpfInput, isValidCpf } from '../../core/date.util';
import { SavedCard } from '../../../domain/entities/payment.model';

@Component({
  selector: 'app-card-register',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent],
  templateUrl: './card-register.component.html',
  styleUrl: './card-register.component.scss',
})
export class CardRegisterComponent implements OnInit {
  readonly cardSaved = output<SavedCard>();

  readonly environment = environment;

  private readonly payment = inject(PaymentService);

  carregando = signal(true);
  salvando = signal(false);
  erro = signal('');
  erroInicial = signal('');

  cpf = '';
  cardNumber = '';
  cardholderName = '';
  expiration = '';
  securityCode = '';

  private mpPublicKey = '';
  sandboxTestCards = signal(true);
  cardVaultMock = signal(false);

  ngOnInit(): void {
    this.payment.obterConfig().subscribe({
      next: (config) => {
        const podeCadastrar = !!config.publicKey && (config.configured || config.cardVaultMock);
        if (!podeCadastrar) {
          this.erroInicial.set(
            'Pagamentos indisponíveis. No Railway da API, confira MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_PUBLIC_KEY e MERCADOPAGO_MOCK_MODE=false (redeploy após salvar).',
          );
        } else {
          this.mpPublicKey = config.publicKey;
          this.sandboxTestCards.set(config.sandboxTestCards !== false);
          this.cardVaultMock.set(config.cardVaultMock === true);
        }
        this.carregando.set(false);
      },
      error: (msg: string) => {
        this.erroInicial.set(msg);
        this.carregando.set(false);
      },
    });
  }

  async salvar(): Promise<void> {
    if (!this.mpPublicKey || this.salvando()) return;

    const digits = this.cardNumber.replace(/\D/g, '');
    const [month, yearShort] = this.expiration.split('/').map((p) => p.trim());
    const year = yearShort?.length === 2 ? `20${yearShort}` : yearShort;
    const cpf = cpfDigitsOnly(this.cpf);

    if (!isValidCpf(this.cpf)) {
      this.erro.set('Informe um CPF válido.');
      return;
    }
    if (digits.length < 13) {
      this.erro.set('Informe o número do cartão completo.');
      return;
    }
    if (!month || !year) {
      this.erro.set('Informe a validade no formato MM/AA.');
      return;
    }
    if (!this.securityCode.trim()) {
      this.erro.set('Informe o CVV.');
      return;
    }

    this.salvando.set(true);
    this.erro.set('');

    try {
      const tokenId = await createMercadoPagoCardToken(this.mpPublicKey, {
        cardNumber: digits,
        cardholderName: this.cardholderName.trim(),
        expirationMonth: month.padStart(2, '0'),
        expirationYear: year,
        securityCode: this.securityCode.trim(),
        identificationType: 'CPF',
        identificationNumber: cpf,
      });

      this.payment.salvarCartao(tokenId).subscribe({
        next: (card) => {
          this.salvando.set(false);
          this.limparFormulario();
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

  private limparFormulario(): void {
    this.cpf = '';
    this.cardNumber = '';
    this.cardholderName = '';
    this.expiration = '';
    this.securityCode = '';
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

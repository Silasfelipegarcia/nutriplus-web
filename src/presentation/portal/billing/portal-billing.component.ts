import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardRegisterComponent } from '../../subscription/card-register/card-register.component';
import { PaymentService } from '../../../infrastructure/http/payment.service';
import { PaymentHistoryItem, SavedCard } from '../../../domain/entities/payment.model';

@Component({
  selector: 'app-portal-billing',
  standalone: true,
  imports: [CommonModule, CardRegisterComponent, RouterLink],
  template: `
    <section class="page">
      <h1>Cobrança</h1>
      <h2>Cartões</h2>
      @if (cartoes().length === 0) {
        <p>Nenhum cartão cadastrado.</p>
      } @else {
        <ul>
          @for (c of cartoes(); track c.id) {
            <li>{{ c.brand }} •••• {{ c.lastFourDigits }}
              <button type="button" (click)="remover(c.id)">Remover</button>
            </li>
          }
        </ul>
      }
      <h3>Cadastrar cartão</h3>
      <app-card-register (cardSaved)="onCardSaved($event)" />
      <h2>Histórico</h2>
      @if (historico().length === 0) {
        <p>Sem pagamentos registrados.</p>
      } @else {
        <ul>
          @for (h of historico(); track h.id) {
            <li>{{ h.createdAt | date:'dd/MM/yyyy' }} — {{ h.planNome }} — {{ h.amountLabel }} ({{ h.statusLabel }})</li>
          }
        </ul>
      }
      <p><a routerLink="/app/planos">Ver planos</a></p>
    </section>
  `,
  styles: [`.page { padding: 1.5rem; max-width: 640px; }`],
})
export class PortalBillingComponent implements OnInit {
  private readonly payment = inject(PaymentService);

  cartoes = signal<SavedCard[]>([]);
  historico = signal<PaymentHistoryItem[]>([]);

  ngOnInit(): void {
    this.recarregar();
  }

  recarregar(): void {
    this.payment.listarCartoes().subscribe({ next: (c) => this.cartoes.set(c) });
    this.payment.listarHistorico().subscribe({ next: (h) => this.historico.set(h) });
  }

  onCardSaved(_card: SavedCard): void {
    this.recarregar();
  }

  remover(cardId: string): void {
    this.payment.removerCartao(cardId).subscribe({ next: () => this.recarregar() });
  }
}

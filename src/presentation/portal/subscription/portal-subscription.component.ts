import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanCatalogComponent } from '../../subscription/plan-catalog/plan-catalog.component';
import { PaymentService } from '../../../infrastructure/http/payment.service';
import { SubscriptionStatus } from '../../../domain/entities/payment.model';

@Component({
  selector: 'app-portal-subscription',
  standalone: true,
  imports: [CommonModule, PlanCatalogComponent],
  template: `
    <section class="page">
      <h1>Minha assinatura</h1>
      @if (sub()) {
        <div class="status card">
          <p><strong>Plano:</strong> {{ sub()!.planNome || sub()!.plan }}</p>
          <p><strong>Status:</strong> {{ sub()!.status }}</p>
          @if (sub()!.validUntil) {
            <p><strong>Válido até:</strong> {{ sub()!.validUntil | date:'dd/MM/yyyy' }}</p>
          }
          @if (sub()!.podeCancelar) {
            <button type="button" class="btn btn-outline" (click)="cancelar()" [disabled]="processando()">
              Cancelar renovação automática
            </button>
          }
          @if (sub()!.podeReativar) {
            <button type="button" class="btn btn-primary" (click)="reativar()" [disabled]="processando()">
              Reativar renovação
            </button>
          }
        </div>
      }
      @if (mensagem()) { <p class="ok">{{ mensagem() }}</p> }
      @if (erro()) { <p class="erro">{{ erro() }}</p> }
      <h2>Alterar plano</h2>
      <app-plan-catalog />
    </section>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 960px; }
    .status { padding: 1rem; margin-bottom: 1.5rem; }
    .ok { color: #15803d; }
    .erro { color: #b91c1c; }
  `],
})
export class PortalSubscriptionComponent implements OnInit {
  private readonly payment = inject(PaymentService);

  sub = signal<SubscriptionStatus | null>(null);
  processando = signal(false);
  mensagem = signal('');
  erro = signal('');

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.payment.obterAssinatura().subscribe({
      next: (s) => this.sub.set(s),
      error: (msg: string) => this.erro.set(msg),
    });
  }

  cancelar(): void {
    this.processando.set(true);
    this.payment.cancelarAssinatura().subscribe({
      next: (s) => {
        this.sub.set(s);
        this.mensagem.set('Renovação automática cancelada. Acesso até o fim do período.');
        this.processando.set(false);
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.processando.set(false);
      },
    });
  }

  reativar(): void {
    this.processando.set(true);
    this.payment.reativarAssinatura().subscribe({
      next: (s) => {
        this.sub.set(s);
        this.mensagem.set('Renovação automática reativada.');
        this.processando.set(false);
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.processando.set(false);
      },
    });
  }
}

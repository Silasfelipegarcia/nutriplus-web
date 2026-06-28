import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/auth.facade';
import { PaymentService } from '../../../infrastructure/http/payment.service';
import {
  AthletePlan,
  CHECKOUT_ORDER_STORAGE_KEY,
  CheckoutResponse,
  PlanCatalogItem,
  PlanQuote,
  SavedCard,
  SubscriptionStatus,
} from '../../../domain/entities/payment.model';

@Component({
  selector: 'app-plan-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './plan-catalog.component.html',
  styleUrl: './plan-catalog.component.scss',
})
export class PlanCatalogComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  private readonly payment = inject(PaymentService);
  private readonly router = inject(Router);

  somentePublico = input(false);

  catalogo = signal<PlanCatalogItem[]>([]);
  cobrancaHabilitada = signal(false);
  carregando = signal(true);
  processando = signal<AthletePlan | 'trial' | null>(null);
  mensagem = signal('');
  erro = signal('');

  cartoes = signal<SavedCard[]>([]);
  cartaoSelecionado = signal('');
  cvv = signal('');
  pagamentosConfigurados = signal(true);
  mpPublicKey = signal('');
  cotacoes = signal<Partial<Record<AthletePlan, PlanQuote>>>({});
  assinatura = signal<{ plan?: AthletePlan; status?: string; trialDisponivel?: boolean } | null>(null);

  planosPagos = computed(() =>
    this.catalogo().filter((i) => i.plan === 'ATHLETE_MONTHLY' || i.plan === 'ATHLETE_YEARLY'),
  );

  ngOnInit(): void {
    this.payment.listarCatalogo().subscribe({
      next: (response) => {
        this.catalogo.set(response.plans);
        this.cobrancaHabilitada.set(response.billingEnabled);
        this.carregando.set(false);
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.carregando.set(false);
      },
    });

    if (this.auth.isAuthenticated()) {
      this.payment.obterConfig().subscribe({
        next: (config) => {
          this.mpPublicKey.set(config.publicKey ?? '');
          this.pagamentosConfigurados.set(config.configured && !!config.publicKey);
        },
        error: () => this.pagamentosConfigurados.set(false),
      });

      this.payment.listarCartoes().subscribe({
        next: (cards) => {
          this.cartoes.set(cards);
          if (cards.length > 0) {
            const padrao = cards.find((c) => c.defaultCard) ?? cards[0];
            this.cartaoSelecionado.set(padrao.id);
          }
        },
        error: () => {},
      });

      this.payment.obterAssinatura().subscribe({
        next: (sub: SubscriptionStatus) => this.assinatura.set(sub),
        error: () => {},
      });

      for (const plan of ['ATHLETE_MONTHLY', 'ATHLETE_YEARLY'] as const) {
        this.payment.obterCotacao(plan).subscribe({
          next: (quote) => this.cotacoes.update((atual) => ({ ...atual, [plan]: quote })),
          error: () => {},
        });
      }
    }
  }

  cotacao(plan?: AthletePlan): PlanQuote | undefined {
    return plan ? this.cotacoes()[plan] : undefined;
  }

  isPlanoAtual(plan?: AthletePlan): boolean {
    if (!plan || plan === 'FREE') return plan === 'FREE';
    const sub = this.assinatura();
    return sub?.plan === plan && (sub.status === 'ACTIVE' || sub.status === 'TRIAL' || sub.status === 'CANCELLED_PENDING');
  }

  podeAssinar(item: PlanCatalogItem): boolean {
    if (!this.cobrancaHabilitada()) return false;
    if (item.contatoComercial || !item.plan || item.plan === 'FREE') return false;
    if (item.plan === 'ATHLETE_MONTHLY' && this.assinatura()?.plan === 'ATHLETE_YEARLY') return false;
    return !this.isPlanoAtual(item.plan);
  }

  iniciarTrial(): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], { queryParams: { redirect: '/app/planos' } });
      return;
    }
    if (this.cartoes().length === 0) {
      void this.router.navigate(['/app/cobranca'], { queryParams: { redirect: '/app/planos', trial: '1' } });
      return;
    }
    this.processando.set('trial');
    this.payment.iniciarTrial().subscribe({
      next: () => {
        this.mensagem.set('Trial de 7 dias ativado! Cobrança só após o período.');
        this.processando.set(null);
        this.payment.obterAssinatura().subscribe({ next: (s) => this.assinatura.set(s) });
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.processando.set(null);
      },
    });
  }

  assinarItem(item: PlanCatalogItem): void {
    if (item.plan === 'ATHLETE_MONTHLY' || item.plan === 'ATHLETE_YEARLY') {
      this.assinar(item.plan);
    }
  }

  assinar(plan: 'ATHLETE_MONTHLY' | 'ATHLETE_YEARLY'): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/auth/cadastro'], { queryParams: { redirect: '/planos' } });
      return;
    }
    const item = this.catalogo().find((i) => i.plan === plan);
    if (!item || !this.podeAssinar(item) || this.processando()) return;

    if (!this.pagamentosConfigurados()) {
      this.erro.set('Pagamentos não configurados no servidor.');
      return;
    }

    this.processando.set(plan);
    this.erro.set('');
    this.mensagem.set('');

    if (this.cartoes().length > 0) {
      const cardId = this.cartaoSelecionado();
      if (!cardId) {
        this.erro.set('Selecione um cartão salvo.');
        this.processando.set(null);
        return;
      }
      this.payment.cobrarPlano({ plan, cardId, securityCode: this.cvv() }).subscribe({
        next: (res) => {
          this.processando.set(null);
          if (res.status?.toUpperCase() === 'APPROVED') {
            this.mensagem.set(`Plano ${res.planNome} ativado!`);
            this.payment.obterAssinatura().subscribe({ next: (s) => this.assinatura.set(s) });
          } else {
            this.erro.set(res.statusLabel || 'Pagamento pendente ou recusado.');
          }
        },
        error: (msg: string) => {
          this.erro.set(msg);
          this.processando.set(null);
          this.abrirCheckout(plan);
        },
      });
      return;
    }

    this.abrirCheckout(plan);
  }

  private abrirCheckout(plan: 'ATHLETE_MONTHLY' | 'ATHLETE_YEARLY'): void {
    this.payment.criarCheckout(plan).subscribe({
      next: (checkout) => {
        sessionStorage.setItem(CHECKOUT_ORDER_STORAGE_KEY, checkout.orderId);
        const url = this.urlCheckout(checkout);
        if (url) {
          window.location.href = url;
        } else {
          this.erro.set('Não foi possível abrir o checkout.');
          this.processando.set(null);
        }
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.processando.set(null);
      },
    });
  }

  private urlCheckout(checkout: CheckoutResponse): string | null {
    const isTeste = this.mpPublicKey().startsWith('TEST-');
    const sandbox = checkout.sandboxInitPoint;
    const producao = checkout.initPoint;
    return isTeste ? sandbox || producao || null : producao || sandbox || null;
  }

  onCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    this.cvv.set(digits);
    input.value = digits;
  }
}

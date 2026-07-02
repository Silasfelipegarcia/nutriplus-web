import { Component, HostListener, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/auth.facade';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { PaymentService } from '../../../infrastructure/http/payment.service';
import { FeatureFlagService } from '../../../infrastructure/http/feature-flag.service';
import {
  isPaidPlan,
  PaidPlanCode,
  PlanCatalogItem,
  PlanQuote,
  SavedCard,
  SubscriptionStatus,
} from '../../../domain/entities/payment.model';
import {
  isPlanoAtualSub,
  podeAssinarPlano,
  podeIniciarTrial,
  planosDisponiveis,
} from '../../core/subscription-plan-rules';

@Component({
  selector: 'app-plan-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NutriButtonComponent],
  templateUrl: './plan-catalog.component.html',
  styleUrl: './plan-catalog.component.scss',
})
export class PlanCatalogComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  private readonly payment = inject(PaymentService);
  private readonly featureFlags = inject(FeatureFlagService);
  private readonly router = inject(Router);

  somentePublico = input(false);
  ocultarTrial = input(false);
  /** contratar = sem plano; upgrade = só mudanças disponíveis; todos = catálogo completo (marketing). */
  modo = input<'contratar' | 'upgrade' | 'todos'>('todos');

  catalogo = signal<PlanCatalogItem[]>([]);
  cobrancaHabilitada = signal(false);
  registrationOpen = signal(true);
  carregando = signal(true);
  processando = signal<PaidPlanCode | 'trial' | null>(null);
  mensagem = signal('');
  erro = signal('');

  cartoes = signal<SavedCard[]>([]);
  cartaoSelecionado = signal('');
  cvv = signal('');
  pagamentosConfigurados = signal(true);
  cotacoes = signal<Partial<Record<PaidPlanCode, PlanQuote>>>({});
  assinatura = signal<SubscriptionStatus | null>(null);
  planoSelecionado = signal<PlanCatalogItem | null>(null);
  checkoutAberto = signal(false);
  erroCheckout = signal('');

  planosPagos = computed(() => this.catalogo().filter((i) => isPaidPlan(i.plan)));

  planosExibidos = computed(() => {
    const items = this.planosPagos();
    const modo = this.modo();
    if (this.somentePublico() || modo === 'todos') {
      return items;
    }
    if (modo === 'upgrade' || modo === 'contratar') {
      return planosDisponiveis(items, this.assinatura(), this.cobrancaHabilitada());
    }
    return items;
  });

  ngOnInit(): void {
    void this.featureFlags.isRegistrationOpen().then((open) => this.registrationOpen.set(open));

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

      for (const plan of [
        'ESSENTIAL_MONTHLY',
        'ESSENTIAL_YEARLY',
        'ATHLETE_MONTHLY',
        'ATHLETE_YEARLY',
      ] as const) {
        this.payment.obterCotacao(plan).subscribe({
          next: (quote) => this.cotacoes.update((atual) => ({ ...atual, [plan]: quote })),
          error: () => {},
        });
      }
    }
  }

  cotacao(plan?: PaidPlanCode): PlanQuote | undefined {
    return plan ? this.cotacoes()[plan] : undefined;
  }

  isPlanoAtual(plan?: PlanCatalogItem['plan']): boolean {
    return isPlanoAtualSub(plan, this.assinatura());
  }

  podeAssinar(item: PlanCatalogItem): boolean {
    return podeAssinarPlano(item, this.assinatura(), this.cobrancaHabilitada());
  }

  readonly podeIniciarTrial = podeIniciarTrial;

  iniciarTrial(): void {
    if (!podeIniciarTrial(this.assinatura())) {
      return;
    }
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], { queryParams: { redirect: '/app/assinatura' } });
      return;
    }
    if (this.cartoes().length === 0) {
      void this.router.navigate(['/app/cobranca'], { queryParams: { trial: '1' } });
      return;
    }
    this.processando.set('trial');
    this.payment.iniciarTrial().subscribe({
      next: () => {
        this.mensagem.set('Trial de 7 dias ativado! Acesso completo; após o período, R$ 19,90/mês no Essencial.');
        this.processando.set(null);
        this.payment.obterAssinatura().subscribe({ next: (s) => this.assinatura.set(s) });
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.processando.set(null);
      },
    });
  }

  isAnual(plan: PlanCatalogItem['plan']): boolean {
    return plan === 'ESSENTIAL_YEARLY' || plan === 'ATHLETE_YEARLY';
  }

  iniciarCheckout(item: PlanCatalogItem): void {
    if (!isPaidPlan(item.plan) || !this.podeAssinar(item) || this.processando()) return;

    if (!this.auth.isAuthenticated()) {
      const path = this.registrationOpen() ? '/auth/cadastro' : '/beta';
      void this.router.navigate([path], { queryParams: { redirect: '/app/assinatura' } });
      return;
    }
    if (!this.pagamentosConfigurados()) {
      this.erro.set('Pagamentos não configurados no servidor.');
      return;
    }

    this.planoSelecionado.set(item);
    this.erro.set('');
    this.erroCheckout.set('');
    this.cvv.set('');
    this.checkoutAberto.set(true);
  }

  fecharCheckout(): void {
    if (this.processando()) return;
    this.checkoutAberto.set(false);
    this.planoSelecionado.set(null);
    this.erroCheckout.set('');
    this.cvv.set('');
  }

  confirmarAssinatura(): void {
    const plano = this.planoSelecionado();
    if (!plano || !isPaidPlan(plano.plan)) return;
    this.cobrarComCartaoSalvo(plano.plan);
  }

  cobrarComCartaoSalvo(plan: PaidPlanCode): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], { queryParams: { redirect: '/app/assinatura' } });
      return;
    }
    const item = this.catalogo().find((i) => i.plan === plan);
    if (!item || !this.podeAssinar(item) || this.processando()) return;

    if (!this.pagamentosConfigurados()) {
      this.erro.set('Pagamentos não configurados no servidor.');
      return;
    }
    if (this.cartoes().length === 0) {
      this.erro.set('Cadastre um cartão em Assinatura antes de cobrar.');
      return;
    }
    const cardId = this.cartaoSelecionado();
    if (!cardId) {
      this.erro.set('Selecione um cartão salvo.');
      return;
    }

    this.processando.set(plan);
    this.erro.set('');
    this.erroCheckout.set('');
    this.mensagem.set('');

    this.payment.cobrarPlano({ plan, cardId, securityCode: this.cvv() }).subscribe({
      next: (res) => {
        this.processando.set(null);
        if (res.status?.toUpperCase() === 'APPROVED') {
          this.mensagem.set(`Plano ${res.planNome} ativado!`);
          this.fecharCheckout();
          this.payment.obterAssinatura().subscribe({ next: (s) => this.assinatura.set(s) });
        } else {
          this.erroCheckout.set(res.statusLabel || 'Pagamento pendente ou recusado.');
        }
      },
      error: (msg: string) => {
        this.erroCheckout.set(msg);
        this.processando.set(null);
      },
    });
  }

  onCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    this.cvv.set(digits);
    input.value = digits;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.checkoutAberto()) {
      this.fecharCheckout();
    }
  }
}

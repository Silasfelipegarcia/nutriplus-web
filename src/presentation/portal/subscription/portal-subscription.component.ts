import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { PlanCatalogComponent } from '../../subscription/plan-catalog/plan-catalog.component';
import { PaymentService } from '../../../infrastructure/http/payment.service';
import {
  PaymentHistoryItem,
  PlanCatalogItem,
  SavedCard,
  SubscriptionStatus,
} from '../../../domain/entities/payment.model';
import { paymentStatusLabel, subscriptionStatusLabel } from '../../core/subscription-labels';
import {
  estaEmTrial,
  planosDisponiveis,
  podeIniciarTrial,
  rotuloDiasRestantes,
  rotuloValidadeAssinatura,
  sugestaoUpgrade,
  temAssinaturaAtiva,
} from '../../core/subscription-plan-rules';

@Component({
  selector: 'app-portal-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink, NutriButtonComponent, PlanCatalogComponent],
  templateUrl: './portal-subscription.component.html',
  styleUrl: './portal-subscription.component.scss',
})
export class PortalSubscriptionComponent implements OnInit {
  private readonly payment = inject(PaymentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly subscriptionStatusLabel = subscriptionStatusLabel;
  readonly paymentStatusLabel = paymentStatusLabel;
  readonly estaEmTrial = estaEmTrial;
  readonly podeIniciarTrial = podeIniciarTrial;
  readonly rotuloValidadeAssinatura = rotuloValidadeAssinatura;
  readonly rotuloDiasRestantes = rotuloDiasRestantes;

  sub = signal<SubscriptionStatus | null>(null);
  cartoes = signal<SavedCard[]>([]);
  historico = signal<PaymentHistoryItem[]>([]);
  catalogo = signal<PlanCatalogItem[]>([]);
  cobrancaHabilitada = signal(false);
  processando = signal(false);
  mensagem = signal('');
  erro = signal('');
  iniciarTrialAposCartao = signal(false);
  mostrarUpgrade = signal(false);
  mostrarCancelamento = signal(false);
  confirmarCancelamentoChecked = signal(false);
  confirmarCancelamentoTexto = signal('');

  nomePlanoAtual = computed(() => {
    const s = this.sub();
    if (!s) return '';
    return (s.planNome || s.plan || 'Grátis').trim();
  });

  podeConfirmarCancelamento = computed(() => {
    if (!this.confirmarCancelamentoChecked()) return false;
    const expected = this.nomePlanoAtual().toLowerCase();
    const typed = this.confirmarCancelamentoTexto().trim().toLowerCase();
    return expected.length > 0 && typed === expected;
  });

  precisaContratar = computed(() => {
    if (!this.cobrancaHabilitada()) return false;
    return !temAssinaturaAtiva(this.sub());
  });

  temUpgradeDisponivel = computed(() =>
    planosDisponiveis(this.catalogo(), this.sub(), this.cobrancaHabilitada()).length > 0,
  );

  sugestaoUpgradeItem = computed(() =>
    sugestaoUpgrade(this.catalogo(), this.sub(), this.cobrancaHabilitada()),
  );

  ngOnInit(): void {
    this.iniciarTrialAposCartao.set(this.route.snapshot.queryParamMap.get('trial') === '1');
    const navState = history.state as { cardSaved?: boolean } | undefined;
    if (navState?.cardSaved) {
      this.mensagem.set('Cartão salvo com sucesso.');
    }
    this.route.fragment.subscribe((fragment) => {
      if (fragment === 'cartoes') {
        queueMicrotask(() => document.getElementById('cartoes')?.scrollIntoView({ behavior: 'smooth' }));
      }
      if (fragment === 'upgrade') {
        this.abrirUpgrade();
      }
    });
    if (this.route.snapshot.queryParamMap.get('upgrade') === '1') {
      this.abrirUpgrade();
    }
    this.carregar();
  }

  carregar(): void {
    this.payment.listarCatalogo().subscribe({
      next: (response) => {
        this.catalogo.set(response.plans);
        this.cobrancaHabilitada.set(response.billingEnabled);
      },
      error: () => {},
    });

    this.payment.obterAssinatura().subscribe({
      next: (s) => this.sub.set(s),
      error: (msg: string) => this.erro.set(msg),
    });
    this.payment.listarCartoes().subscribe({
      next: (cards) => {
        this.cartoes.set(cards);
        if (this.iniciarTrialAposCartao() && cards.length > 0 && podeIniciarTrial(this.sub())) {
          this.iniciarTrialAposCartao.set(false);
          this.iniciarTrial();
        }
      },
      error: () => {},
    });
    this.payment.listarHistorico().subscribe({
      next: (items) => this.historico.set(items),
      error: () => {},
    });
  }

  abrirUpgrade(): void {
    this.mostrarUpgrade.set(true);
    queueMicrotask(() => document.getElementById('upgrade')?.scrollIntoView({ behavior: 'smooth' }));
  }

  iniciarTrial(): void {
    if (!podeIniciarTrial(this.sub())) {
      return;
    }
    if (this.cartoes().length === 0) {
      this.erro.set('Cadastre um cartão antes de iniciar o trial.');
      void this.router.navigate(['/app/cobranca'], { queryParams: { trial: '1' } });
      return;
    }
    this.processando.set(true);
    this.payment.iniciarTrial().subscribe({
      next: () => {
        this.mensagem.set('Trial de 7 dias ativado!');
        this.processando.set(false);
        this.carregar();
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.processando.set(false);
      },
    });
  }

  abrirCancelamento(): void {
    this.confirmarCancelamentoChecked.set(false);
    this.confirmarCancelamentoTexto.set('');
    this.mostrarCancelamento.set(true);
  }

  fecharCancelamento(): void {
    this.mostrarCancelamento.set(false);
    this.confirmarCancelamentoChecked.set(false);
    this.confirmarCancelamentoTexto.set('');
  }

  confirmarCancelamento(): void {
    if (!this.podeConfirmarCancelamento()) {
      return;
    }
    this.processando.set(true);
    this.payment.cancelarAssinatura().subscribe({
      next: (s) => {
        this.sub.set(s);
        this.mensagem.set('Renovação automática cancelada. Acesso até o fim do período.');
        this.processando.set(false);
        this.fecharCancelamento();
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

  removerCartao(cardId: string): void {
    this.payment.removerCartao(cardId).subscribe({
      next: () => {
        this.mensagem.set('Cartão removido.');
        this.carregar();
      },
      error: (msg: string) => this.erro.set(msg),
    });
  }

  statusClass(status: string): string {
    const normalized = status?.toUpperCase() ?? '';
    if (normalized === 'APPROVED') return 'history-item__status--approved';
    if (normalized === 'PENDING') return 'history-item__status--pending';
    if (normalized === 'REJECTED' || normalized === 'CANCELLED') return 'history-item__status--rejected';
    return '';
  }

  statusBadgeClass(status: string): string {
    const normalized = status?.toUpperCase() ?? '';
    if (normalized === 'ACTIVE') return 'subscription-page__status-badge--active';
    if (normalized === 'TRIAL') return 'subscription-page__status-badge--trial';
    if (normalized === 'CANCELLED_PENDING') return 'subscription-page__status-badge--cancelled';
    return 'subscription-page__status-badge--default';
  }
}

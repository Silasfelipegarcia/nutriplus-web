import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriConfirmSheetComponent } from '../../../design-system/nutri-confirm-sheet/nutri-confirm-sheet.component';
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
  estaEmTrialAtivo,
  planosParaMudanca,
  podeIniciarTrial,
  rotuloDiasRestantes,
  rotuloValidadeAssinatura,
  sugestaoUpgrade,
  temAssinaturaAtiva,
} from '../../core/subscription-plan-rules';

@Component({
  selector: 'app-portal-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink, NutriButtonComponent, NutriConfirmSheetComponent, PlanCatalogComponent],
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
  readonly estaEmTrialAtivo = estaEmTrialAtivo;
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
  cartaoParaRemover = signal<SavedCard | null>(null);
  mostrarRemoverCartao = signal(false);
  processandoRemoverCartao = signal(false);

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

  podeCancelarRenovacao = computed(() => {
    const s = this.sub();
    if (!s?.podeCancelar) return false;
    return !s.podeReativar;
  });

  precisaContratar = computed(() => {
    if (!this.cobrancaHabilitada()) return false;
    return !temAssinaturaAtiva(this.sub());
  });

  temUpgradeDisponivel = computed(() =>
    planosParaMudanca(this.catalogo(), this.sub(), this.cobrancaHabilitada()).length > 0,
  );

  sugestaoUpgradeItem = computed(() =>
    sugestaoUpgrade(this.catalogo(), this.sub(), this.cobrancaHabilitada()),
  );

  mensagemRemoverCartao = computed(() => {
    const card = this.cartaoParaRemover();
    if (!card) return '';
    return `Tem certeza que deseja excluir o cartão ${card.brand} •••• ${card.lastFourDigits}? Você poderá cadastrar outro quando quiser.`;
  });

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
    this.erro.set('');
    this.payment.cancelarAssinatura().subscribe({
      next: (s) => {
        this.sub.set(s);
        this.mensagem.set(
          s.podeReativar
            ? 'Renovação automática cancelada. Acesso até o fim do período.'
            : 'Renovação automática cancelada.',
        );
        this.processando.set(false);
        this.fecharCancelamento();
        this.carregar();
      },
      error: (msg: string) => {
        const normalized = msg.toLowerCase();
        if (normalized.includes('já está cancelada') || normalized.includes('cancelada')) {
          this.carregar();
          this.mensagem.set('Renovação automática já estava cancelada.');
          this.fecharCancelamento();
        } else {
          this.erro.set(msg);
        }
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

  abrirRemoverCartao(card: SavedCard): void {
    this.erro.set('');
    this.cartaoParaRemover.set(card);
    this.mostrarRemoverCartao.set(true);
  }

  fecharRemoverCartao(): void {
    if (this.processandoRemoverCartao()) return;
    this.mostrarRemoverCartao.set(false);
    this.cartaoParaRemover.set(null);
  }

  confirmarRemoverCartao(): void {
    const card = this.cartaoParaRemover();
    if (!card) return;

    this.processandoRemoverCartao.set(true);
    this.erro.set('');
    this.payment.removerCartao(card.id).subscribe({
      next: () => {
        this.mensagem.set(`Cartão ${card.brand} •••• ${card.lastFourDigits} removido com sucesso.`);
        this.processandoRemoverCartao.set(false);
        this.fecharRemoverCartao();
        this.carregar();
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.processandoRemoverCartao.set(false);
        this.fecharRemoverCartao();
      },
    });
  }

  removerCartao(card: SavedCard): void {
    this.abrirRemoverCartao(card);
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

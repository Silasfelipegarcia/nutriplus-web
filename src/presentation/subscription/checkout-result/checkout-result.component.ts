import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/auth.facade';
import { PaymentService } from '../../../infrastructure/http/payment.service';
import { CHECKOUT_ORDER_STORAGE_KEY, CheckoutSyncRequest } from '../../../domain/entities/payment.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-checkout-result',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="result-page">
      <h1>{{ tipo === 'sucesso' ? 'Pagamento recebido' : 'Pagamento pendente' }}</h1>
      <p>{{ mensagemStatus }}</p>
      @if (avisoLocal) { <p class="aviso">{{ avisoLocal }}</p> }
      <div class="actions">
        <a routerLink="/app/dashboard" class="btn btn-primary">Ir para o painel</a>
        <a routerLink="/app/assinatura" class="btn btn-outline">Ver assinatura</a>
      </div>
    </div>
  `,
  styles: [`
    .result-page { max-width: 32rem; margin: 2rem auto; text-align: center; padding: 1rem; }
    .aviso { font-size: 0.85rem; color: #6b7280; }
    .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem; }
  `],
})
export class CheckoutResultComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthFacade);
  private readonly payment = inject(PaymentService);
  private syncSub?: Subscription;

  tipo: 'sucesso' | 'pendente' = 'pendente';
  mensagemStatus = 'Sincronizando pagamento...';
  avisoLocal = '';

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    this.tipo = path.includes('sucesso') ? 'sucesso' : 'pendente';

    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.sincronizar();
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
  }

  private sincronizar(): void {
    const params = this.route.snapshot.queryParamMap;
    const body: CheckoutSyncRequest = {
      paymentId: params.get('payment_id') ?? params.get('collection_id') ?? undefined,
      externalReference: params.get('external_reference') ?? undefined,
      preferenceId: params.get('preference_id') ?? undefined,
      orderId: sessionStorage.getItem(CHECKOUT_ORDER_STORAGE_KEY) ?? undefined,
    };

    this.syncSub = this.payment.sincronizarCheckout(body).subscribe({
      next: (result) => {
        sessionStorage.removeItem(CHECKOUT_ORDER_STORAGE_KEY);
        const ok = result.status?.toUpperCase() === 'APPROVED';
        this.tipo = ok ? 'sucesso' : 'pendente';
        this.mensagemStatus = ok
          ? `Plano ${result.planNome} ativado com sucesso!`
          : `Status: ${result.statusLabel}. Atualizaremos quando confirmado.`;
      },
      error: (msg: string) => {
        this.mensagemStatus = msg;
        this.avisoLocal = 'Se você acabou de pagar, aguarde e recarregue esta página.';
      },
    });
  }
}

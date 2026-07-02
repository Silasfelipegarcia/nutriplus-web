import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NutriCardComponent } from '../../../design-system/nutri-card/nutri-card.component';
import { CardRegisterComponent } from '../../subscription/card-register/card-register.component';
import { SavedCard } from '../../../domain/entities/payment.model';

@Component({
  selector: 'app-portal-billing',
  standalone: true,
  imports: [RouterLink, NutriCardComponent, CardRegisterComponent],
  templateUrl: './portal-billing.component.html',
  styleUrl: './portal-billing.component.scss',
})
export class PortalBillingComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  mensagem = signal('');

  onCardSaved(_card: SavedCard): void {
    const trial = this.route.snapshot.queryParamMap.get('trial') === '1';
    this.mensagem.set('Cartão salvo! Voltando para assinatura…');
    setTimeout(() => {
      void this.router.navigate(['/app/assinatura'], {
        queryParams: trial ? { trial: '1' } : {},
        fragment: 'cartoes',
        state: { cardSaved: true },
      });
    }, 600);
  }
}

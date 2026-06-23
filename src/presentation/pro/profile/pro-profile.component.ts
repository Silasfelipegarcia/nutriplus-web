import { Component } from '@angular/core';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';

@Component({
  selector: 'app-pro-profile',
  standalone: true,
  imports: [NutriInfoTipComponent],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Perfil Pro</h1>
        <p>Configurações do nutricionista.</p>
      </div>
      <nutri-info-tip
        message="Preço, bio e Stripe Connect podem ser ajustados pela API. Use o app mobile ou entre em contato com suporte para alterações avançadas."
      />
      <div class="portal-card">
        <p>Seu perfil profissional está ativo no Nutri+ Pro.</p>
      </div>
    </div>
  `,
  styleUrl: '../../portal/portal.scss',
})
export class ProProfileComponent {}

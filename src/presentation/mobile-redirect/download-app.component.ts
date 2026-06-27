import { Component } from '@angular/core';
import { NutriButtonComponent } from '../../design-system/nutri-button/nutri-button.component';
import { NutriLogoComponent } from '../../design-system/nutri-logo/nutri-logo.component';
import { environment } from '../../environments/environment';
import { APP_NAME } from '../core/constants';

@Component({
  selector: 'app-download-app',
  standalone: true,
  imports: [NutriLogoComponent, NutriButtonComponent],
  template: `
    <div class="download-page">
      <div class="download-page__card">
        <nutri-logo />
        <h1>O {{ appName }} foi feito para o seu celular</h1>
        <p>
          Para a melhor experiência com planos alimentares, check-ins e sua assistente Luna ou Bruno,
          baixe o app gratuito.
        </p>
        <div class="download-page__badges">
          <nutri-button variant="primary" [block]="true" [href]="playStoreUrl" [external]="true">
            Google Play
          </nutri-button>
          <nutri-button variant="secondary" [block]="true" [href]="appStoreUrl" [external]="true">
            App Store
          </nutri-button>
        </div>
        <div class="download-page__qr">
          Escaneie o QR code na loja ou acesse diretamente pelo link acima.
        </div>
      </div>
    </div>
  `,
  styleUrl: './download-app.component.scss',
})
export class DownloadAppComponent {
  readonly appName = APP_NAME;
  readonly appStoreUrl = environment.appStoreUrl;
  readonly playStoreUrl = environment.playStoreUrl;
}

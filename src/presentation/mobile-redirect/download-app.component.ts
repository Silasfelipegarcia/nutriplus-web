import { Component, OnInit, inject, signal } from '@angular/core';
import { NutriButtonComponent } from '../../design-system/nutri-button/nutri-button.component';
import { NutriLogoComponent } from '../../design-system/nutri-logo/nutri-logo.component';
import { FeatureFlagService } from '../../infrastructure/http/feature-flag.service';
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
        @if (storeLinksVisible()) {
          <h1>O {{ appName }} foi feito para o seu celular</h1>
          <p>
            Para a melhor experiência com planos alimentares, check-ins e sua assistente Luna ou Bruno,
            baixe o app gratuito.
          </p>
          <div class="download-page__badges">
            <nutri-button
              variant="primary"
              [block]="true"
              [href]="playStoreUrl"
              [external]="true"
              analyticsCta="baixar_app_play"
              analyticsLocation="baixar_app"
            >
              Google Play
            </nutri-button>
            <nutri-button
              variant="secondary"
              [block]="true"
              [href]="appStoreUrl"
              [external]="true"
              analyticsCta="baixar_app_ios"
              analyticsLocation="baixar_app"
            >
              App Store
            </nutri-button>
          </div>
          <div class="download-page__qr">
            Escaneie o QR code na loja ou acesse diretamente pelo link acima.
          </div>
        } @else {
          <h1>App em breve nas lojas</h1>
          <p>
            Estamos finalizando o lançamento na App Store e Google Play. Por enquanto, use o Nutri+ pelo navegador
            no seu celular ou computador.
          </p>
          <div class="download-page__badges">
            @if (registrationOpen() === false) {
              <nutri-button variant="primary" [block]="true" to="/beta">Participar do beta</nutri-button>
            } @else if (registrationOpen()) {
              <nutri-button variant="primary" [block]="true" to="/auth/cadastro">Criar conta</nutri-button>
            }
            <nutri-button variant="outline" [block]="true" to="/">Voltar ao site</nutri-button>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './download-app.component.scss',
})
export class DownloadAppComponent implements OnInit {
  readonly appName = APP_NAME;
  readonly appStoreUrl = environment.appStoreUrl;
  readonly playStoreUrl = environment.playStoreUrl;
  readonly storeLinksVisible = signal(false);
  readonly registrationOpen = signal<boolean | null>(null);

  private readonly featureFlags = inject(FeatureFlagService);

  ngOnInit(): void {
    void Promise.all([
      this.featureFlags.isAppStoreLinksVisible(),
      this.featureFlags.isRegistrationOpen(),
    ]).then(([stores, registration]) => {
      this.storeLinksVisible.set(stores);
      this.registrationOpen.set(registration);
    });
  }
}

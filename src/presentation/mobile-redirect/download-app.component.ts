import { Component, OnInit, inject, signal } from '@angular/core';
import { NutriButtonComponent } from '../../design-system/nutri-button/nutri-button.component';
import { NutriLogoComponent } from '../../design-system/nutri-logo/nutri-logo.component';
import { FeatureFlagService } from '../../infrastructure/http/feature-flag.service';
import { environment } from '../../environments/environment';
import {
  androidApkDownloadUrl,
  androidApkVersionLabel,
  hasDirectAndroidApkDownload,
  hasIosAdHocDownload,
  hasIosTestFlightDownload,
  hasAnyMobileDownload,
  iosAdHocInstallUrl,
  iosTestFlightUrl,
  iosVersionLabel,
} from '../core/app-download.config';
import { APP_NAME } from '../core/constants';

@Component({
  selector: 'app-download-app',
  standalone: true,
  imports: [NutriLogoComponent, NutriButtonComponent],
  template: `
    <div class="download-page">
      <div class="download-page__card">
        <nutri-logo />
        @if (downloadVisible()) {
          <h1>O {{ appName }} foi feito para o seu celular</h1>
          <p>
            Para a melhor experiência com planos alimentares, check-ins e sua assistente Luna ou Bruno,
            baixe o app gratuito.
          </p>
          <div class="download-page__badges">
            @if (hasApkDownload) {
              <nutri-button
                variant="primary"
                [block]="true"
                [href]="androidApkDownloadUrl"
                download="nutriplus.apk"
                analyticsCta="baixar_app_apk"
                analyticsLocation="baixar_app"
              >
                Baixar Android{{ apkVersionLabel ? ' (' + apkVersionLabel + ')' : '' }}
              </nutri-button>
              <p class="download-page__hint">
                Toque em Baixar e confira a barra de notificações ou a pasta <strong>Downloads</strong>
                (Arquivos → Downloads). Abra <strong>nutriplus.apk</strong> para instalar.
                Se pedir, permita instalar de “fontes desconhecidas” para o Chrome ou Arquivos.
              </p>
            } @else if (storeLinksVisible()) {
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
            }
            @if (hasIosTestFlight) {
              <nutri-button
                variant="secondary"
                [block]="true"
                [href]="iosTestFlightUrl"
                [external]="true"
                analyticsCta="baixar_app_testflight"
                analyticsLocation="baixar_app"
              >
                iPhone — TestFlight{{ iosVersion ? ' (' + iosVersion + ')' : '' }}
              </nutri-button>
            } @else if (hasIosAdHoc) {
              <nutri-button
                variant="secondary"
                [block]="true"
                [href]="iosAdHocInstallUrl"
                [external]="true"
                analyticsCta="baixar_app_ios_adhoc"
                analyticsLocation="baixar_app"
              >
                iPhone — instalar{{ iosVersion ? ' (' + iosVersion + ')' : '' }}
              </nutri-button>
              <p class="download-page__hint">
                Abra no Safari do iPhone. Disponível apenas para aparelhos cadastrados no beta iOS.
              </p>
            } @else if (storeLinksVisible()) {
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
            }
          </div>
          @if (storeLinksVisible() && !hasApkDownload && !hasIosTestFlight && !hasIosAdHoc) {
            <div class="download-page__qr">
              Escaneie o QR code na loja ou acesse diretamente pelo link acima.
            </div>
          }
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
  readonly androidApkDownloadUrl = androidApkDownloadUrl;
  readonly apkVersionLabel = androidApkVersionLabel;
  readonly iosTestFlightUrl = iosTestFlightUrl;
  readonly iosAdHocInstallUrl = iosAdHocInstallUrl;
  readonly iosVersion = iosVersionLabel;
  readonly hasApkDownload = hasDirectAndroidApkDownload;
  readonly hasIosTestFlight = hasIosTestFlightDownload;
  readonly hasIosAdHoc = hasIosAdHocDownload;
  readonly storeLinksVisible = signal(false);
  readonly downloadVisible = signal(false);
  readonly registrationOpen = signal<boolean | null>(null);

  private readonly featureFlags = inject(FeatureFlagService);

  ngOnInit(): void {
    void Promise.all([
      this.featureFlags.isAppStoreLinksVisible(),
      this.featureFlags.isRegistrationOpen(),
    ]).then(([stores, registration]) => {
      this.storeLinksVisible.set(stores);
      this.registrationOpen.set(registration);
      this.downloadVisible.set(stores || hasAnyMobileDownload);
    });
  }
}

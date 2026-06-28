import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { CookieConsentService } from '../../../infrastructure/analytics/cookie-consent.service';
import { AnalyticsCtaDirective } from '../../analytics/analytics-cta.directive';
import { TAGLINE, APP_NAME } from '../../core/constants';

@Component({
  selector: 'app-marketing-footer',
  standalone: true,
  imports: [RouterLink, NutriLogoComponent, AnalyticsCtaDirective],
  template: `
    <footer class="site-footer">
      <div class="container">
        <div class="site-footer__grid">
          <div class="site-footer__brand">
            <nutri-logo variant="light" />
            <p>{{ tagline }}</p>
            <p class="site-footer__trust">Nutrição com ciência · Dados protegidos · Feito no Brasil 🇧🇷</p>
          </div>
          <div>
            <h4>Produto</h4>
            <ul>
              <li><a href="#recursos">Recursos</a></li>
              <li><a href="#como-funciona">Como funciona</a></li>
              <li><a href="#download">Download</a></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li>
                <a routerLink="/privacidade" appAnalyticsCta="privacidade" appAnalyticsCtaLocation="footer">Privacidade</a>
              </li>
              <li>
                <a routerLink="/termos" appAnalyticsCta="termos" appAnalyticsCtaLocation="footer">Termos de uso</a>
              </li>
              <li>
                <a routerLink="/cookies" appAnalyticsCta="cookies" appAnalyticsCtaLocation="footer">Cookies</a>
              </li>
              <li>
                <button type="button" class="site-footer__link" (click)="openCookiePreferences()">
                  Preferências de cookies
                </button>
              </li>
              <li>
                <a routerLink="/seguranca" appAnalyticsCta="seguranca" appAnalyticsCtaLocation="footer">Segurança</a>
              </li>
            </ul>
          </div>
        </div>
        <div class="site-footer__bottom">
          © {{ year }} {{ appName }}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  `,
  styleUrl: './marketing-footer.component.scss',
})
export class MarketingFooterComponent {
  private readonly cookieConsent = inject(CookieConsentService);

  readonly tagline = TAGLINE;
  readonly appName = APP_NAME;
  readonly year = new Date().getFullYear();

  openCookiePreferences(): void {
    this.cookieConsent.clearDecision();
  }
}

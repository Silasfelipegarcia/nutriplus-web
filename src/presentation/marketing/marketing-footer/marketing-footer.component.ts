import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { TAGLINE, APP_NAME } from '../../core/constants';

@Component({
  selector: 'app-marketing-footer',
  standalone: true,
  imports: [RouterLink, NutriLogoComponent],
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
              <li><a routerLink="/privacidade">Privacidade</a></li>
              <li><a routerLink="/termos">Termos de uso</a></li>
              <li><a routerLink="/cookies">Cookies</a></li>
              <li><a routerLink="/seguranca">Segurança</a></li>
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
  readonly tagline = TAGLINE;
  readonly appName = APP_NAME;
  readonly year = new Date().getFullYear();
}

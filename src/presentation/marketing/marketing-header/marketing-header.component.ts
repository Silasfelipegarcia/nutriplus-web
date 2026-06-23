import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-marketing-header',
  standalone: true,
  imports: [RouterLink, NutriLogoComponent],
  template: `
    <header class="site-header" [class.site-header--scrolled]="scrolled()">
      <div class="container site-header__inner">
        <nutri-logo />
        <nav class="site-header__nav" aria-label="Principal">
          <a href="#recursos">Recursos</a>
          <a href="#ciencia">Ciência</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#assistentes">Assistentes</a>
          <a href="#seguranca">Segurança</a>
        </nav>
        <div class="site-header__actions">
          <a class="header-btn header-btn--outline" routerLink="/auth/login">Entrar</a>
          <a class="header-btn header-btn--primary" routerLink="/auth/cadastro">Cadastrar</a>
        </div>
        <a class="header-btn header-btn--primary header-btn--sm site-header__mobile-cta" [href]="playStoreUrl">
          Baixar app
        </a>
      </div>
    </header>
  `,
  styleUrl: './marketing-header.component.scss',
})
export class MarketingHeaderComponent {
  readonly playStoreUrl = environment.playStoreUrl;
  readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }
}

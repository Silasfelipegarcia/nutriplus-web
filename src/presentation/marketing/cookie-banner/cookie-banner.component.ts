import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';

const COOKIE_KEY = 'nutri_cookie_consent';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [NutriButtonComponent, RouterLink],
  template: `
    @if (visible()) {
      <div class="cookie-banner" role="dialog" aria-label="Consentimento de cookies">
        <div class="cookie-banner__inner">
          <p class="cookie-banner__text">
            Usamos cookies essenciais e, com seu consentimento, cookies de análise para melhorar sua
            experiência.
            <a routerLink="/cookies">Saiba mais</a>
          </p>
          <div class="cookie-banner__actions">
            <nutri-button variant="ghost" size="sm" (click)="reject()">Recusar</nutri-button>
            <nutri-button variant="primary" size="sm" (click)="accept()">Aceitar</nutri-button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './cookie-banner.component.scss',
})
export class CookieBannerComponent implements OnInit {
  readonly visible = signal(false);

  ngOnInit(): void {
    const consent = localStorage.getItem(COOKIE_KEY);
    this.visible.set(!consent);
  }

  accept(): void {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    this.visible.set(false);
  }

  reject(): void {
    localStorage.setItem(COOKIE_KEY, 'rejected');
    this.visible.set(false);
  }
}

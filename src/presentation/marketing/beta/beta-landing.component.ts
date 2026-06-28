import { DOCUMENT } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarketingHeaderComponent } from '../marketing-header/marketing-header.component';
import { MarketingFooterComponent } from '../marketing-footer/marketing-footer.component';
import { BetaSignupFormComponent } from '../../auth/beta-signup-form/beta-signup-form.component';
import { NutriCardComponent } from '../../../design-system/nutri-card/nutri-card.component';
import { AnalyticsCtaDirective } from '../../analytics/analytics-cta.directive';

@Component({
  selector: 'app-beta-landing',
  standalone: true,
  imports: [
    RouterLink,
    MarketingHeaderComponent,
    MarketingFooterComponent,
    BetaSignupFormComponent,
    NutriCardComponent,
    AnalyticsCtaDirective,
  ],
  template: `
    <div class="beta-page">
      <app-marketing-header />
      <main class="beta-page__main">
        <section class="beta-hero container">
          <div class="beta-hero__mobile-head">
            <p class="beta-hero__eyebrow">Beta · vagas limitadas</p>
            <h1>Solicite seu acesso</h1>
            <p class="beta-hero__mobile-lead">Cadastro rápido — analisamos e liberamos por e-mail.</p>
          </div>

          <nutri-card class="beta-hero__form-card">
            <app-beta-signup-form
              [showFooterLinks]="false"
              [compact]="true"
              analyticsLocation="beta_landing"
            />
          </nutri-card>
          <p class="beta-hero__mobile-login">
            Já tem conta? <a routerLink="/auth/login">Entrar</a>
          </p>

          <div class="beta-hero__copy">
            <p class="beta-hero__eyebrow">Beta fechado · vagas limitadas</p>
            <h1>Participe do beta do Nutri+ — plano alimentar com IA</h1>
            <p class="beta-hero__lead">
              Teste antes de todo mundo um app que monta seu plano alimentar, lista de compras e
              acompanhamento diário com assistentes Luna e Bruno — pensado para sua rotina real.
            </p>
            <ul class="beta-hero__bullets">
              <li>Plano personalizado com macros e metas</li>
              <li>Lista de compras inteligente por categoria</li>
              <li>Check-ins e evolução sem culpa</li>
            </ul>
            <a routerLink="/" class="beta-hero__link" appAnalyticsCta="saiba_mais_home" appAnalyticsCtaLocation="beta_hero">
              Conheça o Nutri+
            </a>
          </div>
        </section>

        <details class="beta-mobile-more container">
          <summary>Como funciona o beta?</summary>
          <ol class="beta-mobile-more__steps">
            <li>Preencha o formulário acima.</li>
            <li>Analisamos seu perfil em lotes.</li>
            <li>Você recebe e-mail quando for aprovado.</li>
          </ol>
          <p class="beta-mobile-more__note">O beta é gratuito. Seus dados seguem a LGPD.</p>
        </details>

        <section class="beta-steps container beta-page__desktop-only">
          <h2>Como funciona o beta</h2>
          <ol class="beta-steps__list">
            <li><strong>Solicite acesso</strong> — preencha o formulário com seus dados.</li>
            <li><strong>Analisamos seu perfil</strong> — liberamos participantes em lotes.</li>
            <li><strong>Você recebe acesso</strong> — entrará por e-mail quando for aprovado.</li>
          </ol>
        </section>

        <section class="beta-faq container beta-page__desktop-only" id="faq">
          <h2>Perguntas frequentes</h2>
          @for (item of faq; track item.q) {
            <details class="beta-faq__item">
              <summary>{{ item.q }}</summary>
              <p>{{ item.a }}</p>
            </details>
          }
        </section>
      </main>
      <app-marketing-footer />
    </div>
  `,
  styleUrl: './beta-landing.component.scss',
})
export class BetaLandingComponent implements OnInit {
  private readonly document = inject(DOCUMENT);

  readonly faq = [
    {
      q: 'O beta é gratuito?',
      a: 'Sim. Durante o período de testes você usa o Nutri+ sem custo. Podemos pedir feedback para melhorar o produto.',
    },
    {
      q: 'Quando recebo acesso?',
      a: 'Analisamos as solicitações em lotes. Você receberá um e-mail quando sua conta for liberada para login.',
    },
    {
      q: 'Preciso ser nutricionista?',
      a: 'Não. Esta página é para pessoas que querem organizar a alimentação. Nutricionistas têm cadastro Pro separado.',
    },
    {
      q: 'Meus dados estão seguros?',
      a: 'Sim. Seguimos a LGPD. Leia nossa política de privacidade para mais detalhes.',
    },
  ];

  ngOnInit(): void {
    this.injectFaqSchema();
  }

  private injectFaqSchema(): void {
    const id = 'beta-faq-schema';
    this.document.getElementById(id)?.remove();
    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: this.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
    this.document.head.appendChild(script);
  }
}

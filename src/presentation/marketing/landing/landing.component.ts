import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MarketingHeaderComponent } from '../marketing-header/marketing-header.component';
import { MarketingFooterComponent } from '../marketing-footer/marketing-footer.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriCardComponent } from '../../../design-system/nutri-card/nutri-card.component';
import { DisclaimerBannerComponent } from '../../../design-system/disclaimer-banner/disclaimer-banner.component';
import { RevealDirective } from '../directives/reveal.directive';
import { AnalyticsCtaDirective } from '../../analytics/analytics-cta.directive';
import { NutriIconComponent } from './nutri-icon.component';
import { FeatureFlagService } from '../../../infrastructure/http/feature-flag.service';
import { TAGLINE, APP_NAME } from '../../core/constants';
import { environment } from '../../../environments/environment';
import { hasDirectAndroidApkDownload, androidApkDownloadUrl, androidApkVersionLabel, hasAnyMobileDownload, hasIosAdHocDownload, hasIosTestFlightDownload, iosAdHocInstallUrl, iosTestFlightUrl, iosVersionLabel } from '../../core/app-download.config';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    MarketingHeaderComponent,
    MarketingFooterComponent,
    NutriButtonComponent,
    NutriCardComponent,
    DisclaimerBannerComponent,
    RevealDirective,
    AnalyticsCtaDirective,
    NutriIconComponent,
  ],
  template: `
    <div class="landing">
      <app-marketing-header />
      <main>
        <section class="hero">
          <div class="hero__bg" aria-hidden="true">
            <div class="hero__orb hero__orb--1" [style.transform]="orbTransform(0.08)"></div>
            <div class="hero__orb hero__orb--2" [style.transform]="orbTransform(0.14)"></div>
            <div class="hero__orb hero__orb--3" [style.transform]="orbTransform(0.05)"></div>
            <div class="hero__grid-pattern"></div>
            <div class="hero__leaf hero__leaf--1" aria-hidden="true"></div>
            <div class="hero__leaf hero__leaf--2" aria-hidden="true"></div>
          </div>

          <div class="container hero__grid">
            <div class="hero__content" [style.transform]="contentTransform()">
              <span class="hero__badge">
                <app-nutri-icon name="leaf" [size]="16" />
                Nutrição baseada em ciência
              </span>
              <h1 class="hero__title">
                Sua alimentação organizada,
                <span class="hero__title-accent">com confiança</span>
              </h1>
              <p class="hero__subtitle">
                Planos alimentares personalizados, macros calculados com fórmulas reconhecidas e
                acompanhamento diário — para você evoluir com clareza e consistência.
              </p>
              <div class="hero__ctas">
                @if (registrationOpen()) {
                  <nutri-button
                    variant="primary"
                    to="/auth/cadastro"
                    analyticsCta="comecar_gratis"
                    analyticsLocation="hero"
                  >Começar gratuitamente</nutri-button>
                } @else if (registrationOpen() === false) {
                  <nutri-button
                    variant="beta"
                    to="/beta"
                    analyticsCta="participar_beta"
                    analyticsLocation="hero"
                  >Participar do beta</nutri-button>
                }
                @if (appDownloadVisible()) {
                  <nutri-button
                    variant="outline"
                    to="/baixar-app"
                    analyticsCta="baixar_app"
                    analyticsLocation="hero"
                  >Baixar app</nutri-button>
                }
              </div>
              <p class="hero__trust-note">
                <app-nutri-icon name="shield" [size]="16" />
                Seus dados protegidos · IA transparente · Apoio à consulta profissional
              </p>
              <div class="hero__stats">
                @for (stat of heroStats; track stat.label) {
                  <div class="hero__stat">
                    <strong>{{ stat.value }}</strong>
                    <span>{{ stat.label }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="hero__visual" [style.transform]="mockupTransform()" aria-hidden="true">
              <div class="hero__mockup-glow"></div>
              <div class="hero__mockup">
                <div class="mockup-header">
                  <div class="mockup-bar"><span></span><span></span><span></span></div>
                  <span class="mockup-greeting">Plano de hoje</span>
                </div>
                <div class="mockup-ring-wrap">
                  <div class="mockup-ring" role="presentation">
                    <div class="mockup-ring__center">
                      <strong>1.840</strong>
                      <small>kcal meta</small>
                    </div>
                  </div>
                  <div class="mockup-ring-legend">
                    @for (m of mockMacros.slice(1); track m.label) {
                      <span><i></i>{{ m.value }} {{ m.label }}</span>
                    }
                  </div>
                </div>
                <div class="mockup-progress">
                  <div class="mockup-progress__label">
                    <span>Aderência alimentar</span>
                    <strong>67%</strong>
                  </div>
                  <div class="mockup-progress__bar"><span style="width: 67%"></span></div>
                </div>
                @for (meal of mockMeals; track meal.name) {
                  <div class="mockup-meal" [class.mockup-meal--done]="meal.done">
                    <span class="mockup-meal__dot"></span>
                    <span>{{ meal.name }}</span>
                    <span class="mockup-meal__kcal">{{ meal.kcal }} kcal</span>
                  </div>
                }
              </div>
              <div class="hero__float-card hero__float-card--verified">
                <app-nutri-icon name="science" [size]="18" />
                Mifflin-St Jeor
              </div>
              <div class="hero__float-card hero__float-card--luna">
                <app-nutri-icon name="leaf" [size]="18" />
                Luna · sua assistente
              </div>
            </div>
          </div>
        </section>

        <section class="trust-strip" aria-label="Diferenciais de confiança">
          <div class="container trust-strip__inner">
            @for (pill of trustPills; track pill.label) {
              <div class="trust-strip__item">
                <app-nutri-icon [name]="pill.icon" [size]="20" />
                <span>{{ pill.label }}</span>
              </div>
            }
          </div>
        </section>

        <section id="ciencia" class="section section--science">
          <div class="container">
            <div appReveal class="section-head">
              <span class="section-eyebrow">Base científica</span>
              <h2 class="section-title">Nutrição com método, não achismo</h2>
              <p class="section-subtitle section-subtitle--center">
                Cada plano parte de cálculos nutricionais determinísticos — a IA organiza refeições
                em cima de metas já validadas, sem inventar números.
              </p>
            </div>
            <div class="science__grid">
              @for (item of scienceItems; track item.title; let i = $index) {
                <div appReveal class="science-card" [revealDelay]="i * 100">
                  <div class="science-card__icon">
                    <app-nutri-icon [name]="item.icon" [size]="28" />
                  </div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.text }}</p>
                  <span class="science-card__tag">{{ item.tag }}</span>
                </div>
              }
            </div>
          </div>
        </section>

        <section id="recursos" class="section section--alt">
          <div class="container">
            <div appReveal class="section-head">
              <span class="section-eyebrow">Recursos</span>
              <h2 class="section-title">Tudo para sua jornada alimentar</h2>
              <p class="section-subtitle section-subtitle--center">
                Recursos pensados para organização, consistência e evolução real.
              </p>
            </div>
            <div class="features__grid">
              @for (f of features; track f.title; let i = $index) {
                <div appReveal [revealDelay]="i * 80">
                  <nutri-card [title]="f.title" [hover]="true">
                    <div class="feature-card">
                      <div class="feature-card__icon-wrap">
                        <app-nutri-icon [name]="f.icon" [size]="26" />
                      </div>
                      <p>{{ f.text }}</p>
                    </div>
                  </nutri-card>
                </div>
              }
            </div>
          </div>
        </section>

        <section id="como-funciona" class="section section--white">
          <div class="container">
            <div appReveal class="section-head">
              <span class="section-eyebrow">Passo a passo</span>
              <h2 class="section-title">Como funciona</h2>
              <p class="section-subtitle section-subtitle--center">
                Em poucos passos você tem um plano alimentar completo.
              </p>
            </div>
            <div class="steps">
              @for (s of steps; track s.num; let i = $index) {
                <div appReveal class="step" [revealDelay]="i * 100">
                  <div class="step__connector" aria-hidden="true"></div>
                  <div class="step__num">{{ s.num }}</div>
                  <h3>{{ s.title }}</h3>
                  <p>{{ s.text }}</p>
                </div>
              }
            </div>
          </div>
        </section>

        <section id="planos" class="section section--white">
          <div class="container">
            <div appReveal class="section-head">
              <span class="section-eyebrow">Modo Atleta</span>
              <h2 class="section-title">Planos para quem treina</h2>
              <p class="section-subtitle section-subtitle--center">
                Macros ajustados ao treino, trial de 7 dias e cancelamento a qualquer momento.
              </p>
            </div>
            <div appReveal class="section-head" style="margin-top: 1.5rem;">
              <nutri-button variant="primary" to="/planos" analyticsCta="landing_planos_cta">
                Ver planos Atleta
              </nutri-button>
            </div>
          </div>
        </section>

        <section class="commitment-band">
          <div class="container commitment-band__inner" appReveal>
            <div class="commitment-band__icon">
              <app-nutri-icon name="shield" [size]="32" />
            </div>
            <div>
              <h2>Nosso compromisso com você</h2>
              <p>
                O {{ appName }} é uma ferramenta de <strong>organização e educação alimentar</strong>.
                Utilizamos inteligência artificial para montar planos a partir dos seus dados —
                mas reforçamos sempre: recomendações automatizadas <strong>não substituem</strong>
                consulta, diagnóstico ou acompanhamento com nutricionista ou médico.
              </p>
            </div>
          </div>
        </section>

        <section id="assistentes" class="section section--parallax">
          <div class="section__parallax-bg" [style.transform]="parallaxBg()" aria-hidden="true"></div>
          <div class="container section__parallax-content">
            <div appReveal class="section-head">
              <span class="section-eyebrow">Assistentes IA</span>
              <h2 class="section-title">Escolha quem te acompanha</h2>
              <p class="section-subtitle section-subtitle--center">
                Dois estilos, o mesmo cuidado com sua nutrição.
              </p>
            </div>
            <div class="agents__grid">
              <div appReveal class="agent-card agent-card--luna">
                <div class="agent-card__avatar">
                  <app-nutri-icon name="leaf" [size]="28" />
                </div>
                <span class="agent-card__role">Tom acolhedor</span>
                <h3>Luna</h3>
                <p>Motivação gentil, organização leve e celebração de cada pequena vitória na sua rotina.</p>
              </div>
              <div appReveal class="agent-card agent-card--bruno" [revealDelay]="120">
                <div class="agent-card__avatar">
                  <app-nutri-icon name="chart" [size]="28" />
                </div>
                <span class="agent-card__role">Tom objetivo</span>
                <h3>Bruno</h3>
                <p>Direto ao ponto, foco em metas e execução prática do seu plano alimentar.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="section section--white">
          <div class="container">
            <div appReveal class="section-head">
              <span class="section-eyebrow">Depoimentos</span>
              <h2 class="section-title">Quem usa, recomenda</h2>
            </div>
            <div class="testimonials">
              @for (t of testimonials; track t.name; let i = $index) {
                <div appReveal [revealDelay]="i * 100">
                  <nutri-card>
                    <div class="testimonial-stars" aria-hidden="true">★★★★★</div>
                    <blockquote class="testimonial">"{{ t.quote }}"</blockquote>
                    <cite class="testimonial__author">{{ t.name }}</cite>
                    <span class="testimonial__role">{{ t.role }}</span>
                  </nutri-card>
                </div>
              }
            </div>
          </div>
        </section>

        <section id="seguranca" class="section section--alt">
          <div class="container">
            <div appReveal class="section-head">
              <span class="section-eyebrow">Confiança</span>
              <h2 class="section-title">Segurança e transparência</h2>
              <p class="section-subtitle section-subtitle--center">
                Seus dados protegidos, com total clareza sobre o uso de IA.
              </p>
            </div>
            <div class="trust__grid">
              @for (t of trustItems; track t.title; let i = $index) {
                <div appReveal [revealDelay]="i * 80">
                  <nutri-card>
                    <div class="trust-item">
                      <span class="trust-item__icon">
                        <app-nutri-icon [name]="t.icon" [size]="24" />
                      </span>
                      <div>
                        <h3 class="nutri-card__title">{{ t.title }}</h3>
                        <p class="nutri-card__body">{{ t.text }}</p>
                      </div>
                    </div>
                  </nutri-card>
                </div>
              }
            </div>
            <div appReveal class="trust-disclaimer">
              <nutri-disclaimer />
            </div>
          </div>
        </section>

        @if (appDownloadVisible()) {
          <section id="download" class="section download">
            <div class="download__glow" aria-hidden="true"></div>
            <div class="container" appReveal>
              <h2 class="section-title section-title--light">Baixe o {{ appName }}</h2>
              <p class="section-subtitle section-subtitle--center section-subtitle--light">
                @if (hasApkDownload && (hasIosTestFlight || hasIosAdHoc)) {
                  Download direto para Android e iPhone (beta).
                } @else if (hasApkDownload) {
                  Android disponível para download direto. iOS em breve.
                } @else if (hasIosTestFlight || hasIosAdHoc) {
                  iPhone disponível via TestFlight ou beta cadastrado.
                } @else {
                  Disponível para iOS e Android. No celular, use o app para a melhor experiência.
                }
              </p>
              <div class="download__badges">
                @if (hasApkDownload) {
                  <a
                    class="store-badge"
                    [href]="androidApkDownloadUrl"
                    download="nutriplus.apk"
                    appAnalyticsCta="baixar_app_apk"
                    appAnalyticsCtaLocation="download_section"
                  >
                    <span class="store-badge__icon">📲</span>
                    <span><small>Download direto</small>Android {{ apkVersionLabel || 'APK' }}</span>
                  </a>
                } @else if (appStoreLinksVisible()) {
                  <a
                    class="store-badge"
                    [href]="playStoreUrl"
                    target="_blank"
                    rel="noopener"
                    appAnalyticsCta="baixar_app_play"
                    appAnalyticsCtaLocation="download_section"
                  >
                    <span class="store-badge__icon">▶️</span>
                    <span><small>Disponível no</small>Google Play</span>
                  </a>
                }
                @if (hasIosTestFlight) {
                  <a
                    class="store-badge"
                    [href]="iosTestFlightUrl"
                    target="_blank"
                    rel="noopener"
                    appAnalyticsCta="baixar_app_testflight"
                    appAnalyticsCtaLocation="download_section"
                  >
                    <span class="store-badge__icon">🍎</span>
                    <span><small>TestFlight</small>iPhone {{ iosVersionLabel || '' }}</span>
                  </a>
                } @else if (hasIosAdHoc) {
                  <a
                    class="store-badge"
                    [href]="iosAdHocInstallUrl"
                    appAnalyticsCta="baixar_app_ios_adhoc"
                    appAnalyticsCtaLocation="download_section"
                  >
                    <span class="store-badge__icon">🍎</span>
                    <span><small>Instalar no iPhone</small>{{ iosVersionLabel || 'Beta iOS' }}</span>
                  </a>
                } @else if (appStoreLinksVisible()) {
                  <a
                    class="store-badge"
                    [href]="appStoreUrl"
                    target="_blank"
                    rel="noopener"
                    appAnalyticsCta="baixar_app_ios"
                    appAnalyticsCtaLocation="download_section"
                  >
                    <span class="store-badge__icon">🍎</span>
                    <span><small>Disponível na</small>App Store</span>
                  </a>
                }
              </div>
            </div>
          </section>
        }
      </main>
      <app-marketing-footer />
    </div>
  `,
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit, OnDestroy {
  readonly tagline = TAGLINE;
  readonly appName = APP_NAME;
  readonly appStoreUrl = environment.appStoreUrl;
  readonly playStoreUrl = environment.playStoreUrl;
  readonly androidApkDownloadUrl = androidApkDownloadUrl;
  readonly apkVersionLabel = androidApkVersionLabel;
  readonly hasApkDownload = hasDirectAndroidApkDownload;
  readonly hasIosTestFlight = hasIosTestFlightDownload;
  readonly hasIosAdHoc = hasIosAdHocDownload;
  readonly iosTestFlightUrl = iosTestFlightUrl;
  readonly iosAdHocInstallUrl = iosAdHocInstallUrl;
  readonly iosVersionLabel = iosVersionLabel;

  readonly scrollY = signal(0);
  readonly registrationOpen = signal<boolean | null>(null);
  readonly appStoreLinksVisible = signal(false);
  readonly appDownloadVisible = signal(false);

  private readonly featureFlags = inject(FeatureFlagService);

  ngOnInit(): void {
    void Promise.all([
      this.featureFlags.isRegistrationOpen(),
      this.featureFlags.isAppStoreLinksVisible(),
    ]).then(([open, stores]) => {
      this.registrationOpen.set(open);
      this.appStoreLinksVisible.set(stores);
      this.appDownloadVisible.set(stores || hasAnyMobileDownload);
    });
  }

  readonly heroStats = [
    { value: '100%', label: 'Macros calculados' },
    { value: 'LGPD', label: 'Dados protegidos' },
    { value: '24/7', label: 'Acesso ao plano' },
  ];

  readonly trustPills = [
    { icon: 'science' as const, label: 'Fórmulas científicas' },
    { icon: 'shield' as const, label: 'Privacidade LGPD' },
    { icon: 'leaf' as const, label: 'Foco em nutrição' },
    { icon: 'doc' as const, label: 'Termos transparentes' },
  ];

  readonly scienceItems = [
    {
      icon: 'science' as const,
      title: 'Taxa metabólica basal',
      text: 'Calculamos seu gasto basal com Mifflin-St Jeor ou Katch-McArdle quando há composição corporal.',
      tag: 'BMR validado',
    },
    {
      icon: 'chart' as const,
      title: 'Gasto e meta calórica',
      text: 'TDEE ajustado pelo seu nível de atividade e objetivo — perder, manter ou ganhar peso com segurança.',
      tag: 'TDEE + meta',
    },
    {
      icon: 'plate' as const,
      title: 'Distribuição de macros',
      text: 'Proteínas, carboidratos e gorduras definidos antes da IA montar refeições — sem chute.',
      tag: 'P / C / G fixos',
    },
  ];

  readonly mockMacros = [
    { value: '1.840', label: 'kcal' },
    { value: '138g', label: 'proteína' },
    { value: '185g', label: 'carbos' },
    { value: '58g', label: 'gordura' },
  ];

  readonly mockMeals = [
    { name: 'Café da manhã', done: true, kcal: 420 },
    { name: 'Almoço', done: true, kcal: 580 },
    { name: 'Jantar', done: false, kcal: 510 },
  ];

  readonly features = [
    { icon: 'plate' as const, title: 'Plano personalizado', text: 'Refeições montadas sobre seus macros, preferências e restrições alimentares.' },
    { icon: 'chart' as const, title: 'Macros calculados', text: 'Metas diárias com base em ciência nutricional — claras e fáceis de seguir.' },
    { icon: 'cart' as const, title: 'Lista de compras', text: 'Ingredientes da semana organizados para facilitar suas idas ao mercado.' },
    { icon: 'check' as const, title: 'Check-ins diários', text: 'Registre aderência refeição a refeição e acompanhe sua consistência.' },
    { icon: 'trend' as const, title: 'Evolução corporal', text: 'Medições, revisões periódicas e relatórios para enxergar seu progresso.' },
    { icon: 'run' as const, title: 'Modo atleta', text: 'Ajuste calórico extra conforme suas atividades físicas e treinos.' },
  ];

  readonly steps = [
    { num: 1, title: 'Cadastre-se', text: 'Crie sua conta em segundos.' },
    { num: 2, title: 'Escolha Luna ou Bruno', text: 'Defina o tom da sua assistente.' },
    { num: 3, title: 'Informe suas métricas', text: 'Peso, meta, atividade e preferências.' },
    { num: 4, title: 'Receba seu plano', text: 'Plano alimentar e lista de compras gerados por IA.' },
  ];

  readonly testimonials = [
    {
      quote: 'Pela primeira vez entendi quanto comer de cada macro. Me sinto no controle.',
      name: 'Mariana S.',
      role: 'Usuária · objetivo emagrecimento',
    },
    {
      quote: 'A lista de compras e o plano semanal simplificaram minha rotina de forma absurda.',
      name: 'Ricardo L.',
      role: 'Usuário · rotina corrida',
    },
    {
      quote: 'Uso junto com meu nutricionista — ele gostou da clareza dos dados que exporto.',
      name: 'Camila F.',
      role: 'Usuária · acompanhamento profissional',
    },
  ];

  readonly trustItems = [
    { icon: 'lock' as const, title: 'Dados criptografados', text: 'Senhas com BCrypt, comunicação HTTPS e tokens com expiração controlada.' },
    { icon: 'shield' as const, title: 'Privacidade LGPD', text: 'Política clara, controle dos seus dados e transparência no uso de informações.' },
    { icon: 'doc' as const, title: 'Termos acessíveis', text: 'Linguagem direta sobre o que a plataforma faz — e o que não faz.' },
    { icon: 'brain' as const, title: 'IA responsável', text: 'Sugestões de apoio com disclaimer visível. Saúde exige orientação profissional.' },
  ];

  private rafId = 0;
  private pendingScroll = 0;

  @HostListener('window:scroll')
  onScroll(): void {
    this.pendingScroll = window.scrollY;
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.scrollY.set(this.pendingScroll);
        this.rafId = 0;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  orbTransform(factor: number): string {
    const y = this.scrollY() * factor;
    return `translate3d(0, ${y}px, 0)`;
  }

  contentTransform(): string {
    const y = this.scrollY() * 0.04;
    return `translate3d(0, ${y}px, 0)`;
  }

  mockupTransform(): string {
    const y = this.scrollY() * -0.06;
    return `translate3d(0, ${y}px, 0)`;
  }

  parallaxBg(): string {
    const y = (this.scrollY() - 1200) * 0.15;
    return `translate3d(0, ${y}px, 0) scale(1.05)`;
  }
}

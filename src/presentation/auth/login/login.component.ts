import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { AuthFacade } from '../../core/auth.facade';
import { AUTH_REPOSITORY } from '../../../domain/repositories/auth.repository';
import { localizeAuthErrorMessage } from '../../core/auth-error-messages';
import { resolvePostLoginRoute } from '../../core/auth-routing.util';
import { TokenStorage } from '../../../infrastructure/auth/token-storage';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';
import { FeatureFlagService } from '../../../infrastructure/http/feature-flag.service';
import { AnalyticsCtaDirective } from '../../analytics/analytics-cta.directive';
import { APP_NAME } from '../../core/constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, NutriLogoComponent, NutriButtonComponent, NutriInputComponent, AnalyticsCtaDirective],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__logo"><nutri-logo /></div>
        <h1>Entrar</h1>
        <p class="auth-card__subtitle">Acesse seu portal {{ appName }}</p>
        @if (infoMessage) {
          <div class="auth-card__info" role="status">{{ infoMessage }}</div>
        }
        @if (authErrorMessage) {
          <div class="auth-card__error" role="alert">{{ authErrorMessage }}</div>
        }
        @if (contaCongelada()) {
          <div class="auth-card__info" role="status">
            Sua conta está congelada. Confirme e-mail e senha para reativar e continuar de onde parou.
          </div>
          <nutri-button variant="primary" [block]="true" [disabled]="auth.loading()" (click)="reativarConta()">
            {{ auth.loading() ? 'Reativando...' : 'Reativar minha conta' }}
          </nutri-button>
        }
        <form (ngSubmit)="submit()">
          <nutri-input label="E-mail" type="email" [(ngModel)]="email" name="email" />
          <nutri-input label="Senha" type="password" [(ngModel)]="password" name="password" />
          <p class="auth-card__forgot">
            <a routerLink="/auth/esqueci-senha">Esqueci minha senha</a>
          </p>
          <nutri-button variant="primary" type="submit" [block]="true" [disabled]="auth.loading()">
            {{ auth.loading() ? 'Entrando...' : 'Entrar' }}
          </nutri-button>
        </form>
        <p class="auth-card__footer">
          Não tem conta?
          @if (registrationOpen()) {
            <a routerLink="/auth/cadastro" appAnalyticsCta="criar_conta" appAnalyticsCtaLocation="login_footer">Cadastre-se</a>
          } @else if (registrationOpen() === false) {
            <a routerLink="/beta" class="beta-cta-link" appAnalyticsCta="participar_beta" appAnalyticsCtaLocation="login_footer">Participar do beta</a>
          }
        </p>
      </div>
    </div>
  `,
  styleUrl: '../auth-layout.scss',
})
export class LoginComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  readonly appName = APP_NAME;
  readonly registrationOpen = signal<boolean | null>(null);
  readonly contaCongelada = signal(false);
  private readonly authRepo = inject(AUTH_REPOSITORY);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenStorage);
  private readonly analytics = inject(AnalyticsService);
  private readonly featureFlags = inject(FeatureFlagService);

  email = '';
  password = '';
  infoMessage = (history.state?.registerMessage as string | undefined) ?? null;

  ngOnInit(): void {
    this.syncRegistrationFlag();
    void this.featureFlags.prefetch().then(() => this.syncRegistrationFlag());
  }

  private syncRegistrationFlag(): void {
    this.registrationOpen.set(this.featureFlags.isRegistrationOpenSync());
  }

  get authErrorMessage(): string | null {
    const error = this.auth.error();
    return error ? localizeAuthErrorMessage(error) : null;
  }

  async submit(): Promise<void> {
    this.contaCongelada.set(false);
    this.analytics.trackLoginFormStart();
    try {
      await this.auth.login(this.email, this.password);
      this.analytics.trackLogin(this.auth.primaryRole());
      this.router.navigateByUrl(this.postLoginRoute());
    } catch {
      const error = this.auth.error();
      this.analytics.trackLoginError(error ?? 'login_failed');
      if (error?.includes('congelada')) {
        this.contaCongelada.set(true);
      }
    }
  }

  async reativarConta(): Promise<void> {
    this.auth.loading.set(true);
    this.auth.error.set(null);
    try {
      const auth = await this.authRepo.reactivateAccount(this.email, this.password);
      this.auth.user.set(auth.user);
      this.contaCongelada.set(false);
      this.analytics.trackLogin(this.auth.primaryRole());
      this.router.navigateByUrl(this.postLoginRoute());
    } catch (e) {
      this.auth.error.set(e instanceof Error ? e.message : 'Erro ao reativar conta');
    } finally {
      this.auth.loading.set(false);
    }
  }

  private postLoginRoute(): string {
    return resolvePostLoginRoute(
      this.tokens.getAccessToken(),
      this.auth.needsOnboarding(),
      this.auth.needsTerms(),
    );
  }
}

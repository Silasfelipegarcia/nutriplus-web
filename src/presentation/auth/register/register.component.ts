import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { AuthFacade } from '../../core/auth.facade';
import { localizeAuthErrorMessage } from '../../core/auth-error-messages';
import { APP_NAME } from '../../core/constants';
import {
  computeAgeFromBirthDate,
  cpfDigitsOnly,
  formatCpfInput,
  isValidCpf,
  MAX_USER_AGE,
  MIN_USER_AGE,
} from '../../core/date.util';
import { FeatureFlagService } from '../../../infrastructure/http/feature-flag.service';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';
import { AnalyticsCtaDirective } from '../../analytics/analytics-cta.directive';
import { RegistrationMode } from '../../../domain/analytics/analytics.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, NutriLogoComponent, NutriButtonComponent, NutriInputComponent, AnalyticsCtaDirective],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__logo"><nutri-logo /></div>
        @if (registrationOpen()) {
          <h1>Criar conta</h1>
          <p class="auth-card__subtitle">Comece sua jornada alimentar. Exclusivo para maiores de 18 anos.</p>
        } @else {
          <h1>Teste beta Nutri+</h1>
          <p class="auth-card__subtitle">
            Estamos selecionando participantes para o teste beta. Preencha seus dados para solicitar acesso.
          </p>
        }
        <p class="auth-card__footer">
          <a routerLink="/">Saiba mais sobre o {{ appName }}</a>
        </p>
        @if (validationError) {
          <div class="auth-card__error" role="alert">{{ validationError }}</div>
        }
        @if (authErrorMessage) {
          <div class="auth-card__error" role="alert">{{ authErrorMessage }}</div>
        }
        <form (ngSubmit)="submit()">
          <nutri-input label="Nome" [(ngModel)]="name" name="name" />
          <nutri-input label="E-mail" type="email" [(ngModel)]="email" name="email" />
          <nutri-input label="CPF" [(ngModel)]="cpf" name="cpf" placeholder="000.000.000-00" (ngModelChange)="onCpfChange($event)" />
          <nutri-input
            label="Data de nascimento"
            type="date"
            [(ngModel)]="birthDate"
            name="birthDate"
          />
          <nutri-input label="Senha" type="password" [(ngModel)]="password" name="password" />
          <nutri-button
            variant="primary"
            type="submit"
            [block]="true"
            [disabled]="auth.loading() || loadingFlags()"
          >
            @if (auth.loading()) {
              Enviando...
            } @else if (registrationOpen()) {
              Cadastrar
            } @else {
              Solicitar participação no beta
            }
          </nutri-button>
        </form>
        <p class="auth-card__footer">
          Já tem conta? <a routerLink="/auth/login" appAnalyticsCta="entrar" appAnalyticsCtaLocation="signup_footer">Entrar</a>
          · É nutricionista? <a routerLink="/auth/cadastro-nutricionista" appAnalyticsCta="cadastro_pro" appAnalyticsCtaLocation="signup_footer">Cadastro Pro</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: '../auth-layout.scss',
})
export class RegisterComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  readonly appName = APP_NAME;
  private readonly router = inject(Router);
  private readonly featureFlags = inject(FeatureFlagService);
  private readonly analytics = inject(AnalyticsService);

  readonly registrationOpen = signal(true);
  readonly loadingFlags = signal(true);

  name = '';
  email = '';
  password = '';
  cpf = '';
  birthDate = '';
  validationError = '';

  get authErrorMessage(): string | null {
    const error = this.auth.error();
    return error ? localizeAuthErrorMessage(error) : null;
  }

  ngOnInit(): void {
    void this.loadFlags();
  }

  private async loadFlags(): Promise<void> {
    try {
      this.registrationOpen.set(await this.featureFlags.isEnabled('REGISTRATION_OPEN'));
    } finally {
      this.loadingFlags.set(false);
    }
  }

  onCpfChange(value: string): void {
    this.cpf = formatCpfInput(value);
    this.validationError = '';
  }

  async submit(): Promise<void> {
    this.validationError = '';
    if (!this.name.trim()) {
      this.validationError = 'Informe o nome.';
      return;
    }
    if (!this.email.includes('@')) {
      this.validationError = 'E-mail inválido.';
      return;
    }
    if (this.password.length < 6) {
      this.validationError = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }
    if (!isValidCpf(this.cpf)) {
      this.validationError = 'CPF inválido.';
      return;
    }
    if (!this.birthDate) {
      this.validationError = 'Informe sua data de nascimento.';
      return;
    }
    const age = computeAgeFromBirthDate(this.birthDate);
    if (age < MIN_USER_AGE) {
      this.validationError = 'Você precisa ter pelo menos 18 anos.';
      return;
    }
    if (age > MAX_USER_AGE) {
      this.validationError = 'Informe uma data de nascimento válida.';
      return;
    }
    const payload = {
      name: this.name,
      email: this.email,
      password: this.password,
      cpf: cpfDigitsOnly(this.cpf),
      birthDate: this.birthDate,
    };
    const mode: RegistrationMode = this.registrationOpen() ? 'open' : 'beta';
    this.analytics.trackSignUpStart(mode);
    try {
      if (this.registrationOpen()) {
        await this.auth.register(payload.name, payload.email, payload.password, payload.cpf, payload.birthDate);
      } else {
        await this.auth.betaRequest(payload.name, payload.email, payload.password, payload.cpf, payload.birthDate);
      }
      this.analytics.trackSignUp(mode);
      this.router.navigateByUrl('/auth/login', {
        state: {
          registerMessage: this.auth.registerMessage() ?? 'Cadastro recebido. Aguarde a liberação do acesso.',
        },
      });
    } catch {
      const error = this.auth.error();
      this.analytics.trackSignUpError(error ?? 'signup_failed', mode);
    }
  }
}

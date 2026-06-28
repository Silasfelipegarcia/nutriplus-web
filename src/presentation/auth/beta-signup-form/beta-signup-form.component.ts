import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { FeatureFlagService } from '../../../infrastructure/http/feature-flag.service';
import { CampaignAttributionService } from '../../../infrastructure/marketing/campaign-attribution.service';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';
import { AuthFacade } from '../../core/auth.facade';
import { localizeAuthErrorMessage } from '../../core/auth-error-messages';
import {
  computeAgeFromBirthDate,
  cpfDigitsOnly,
  formatCpfInput,
  formatPhoneInput,
  isValidBrazilPhone,
  isValidCpf,
  MAX_USER_AGE,
  MIN_USER_AGE,
  phoneDigitsOnly,
} from '../../core/date.util';
import { BetaProfileType } from '../../../domain/auth/registration.model';
import { RegistrationMode } from '../../../domain/analytics/analytics.model';

@Component({
  selector: 'app-beta-signup-form',
  standalone: true,
  imports: [FormsModule, RouterLink, NutriButtonComponent, NutriInputComponent],
  template: `
    @if (showTitle) {
      <h2 class="beta-form__title">{{ registrationOpen() ? 'Criar conta' : 'Solicite seu acesso ao beta' }}</h2>
      <p class="beta-form__subtitle">
        @if (registrationOpen()) {
          Comece sua jornada alimentar. Exclusivo para maiores de 18 anos.
        } @else {
          Preencha seus dados — analisamos cada solicitação e liberamos o acesso em breve.
        }
      </p>
    }
    @if (validationError) {
      <div class="beta-form__error" role="alert">{{ validationError }}</div>
    }
    @if (authErrorMessage) {
      <div class="beta-form__error" role="alert">{{ authErrorMessage }}</div>
    }
    <form (ngSubmit)="submit()">
      @if (!registrationOpen()) {
        <fieldset class="beta-form__profile">
          <legend>Quero participar como</legend>
          <label class="beta-form__profile-option">
            <input type="radio" name="profileType" value="patient" [(ngModel)]="profileType" />
            Cliente (organizar minha alimentação)
          </label>
          <label class="beta-form__profile-option">
            <input type="radio" name="profileType" value="nutritionist" [(ngModel)]="profileType" />
            Nutricionista (portal Pro)
          </label>
        </fieldset>
      }

      <nutri-input label="Nome" [(ngModel)]="name" name="name" />
      <nutri-input label="E-mail" type="email" [(ngModel)]="email" name="email" />
      <nutri-input
        label="Telefone / WhatsApp"
        [(ngModel)]="phone"
        name="phone"
        placeholder="(11) 98765-4321"
        (ngModelChange)="onPhoneChange($event)"
      />
      <nutri-input label="CPF" [(ngModel)]="cpf" name="cpf" placeholder="000.000.000-00" (ngModelChange)="onCpfChange($event)" />

      @if (registrationOpen() || profileType === 'patient') {
        <nutri-input label="Data de nascimento" type="date" [(ngModel)]="birthDate" name="birthDate" />
      }

      @if (!registrationOpen() && profileType === 'nutritionist') {
        <nutri-input label="CRN" [(ngModel)]="crn" name="crn" placeholder="Ex: CRN-3 12345" />
        <nutri-input label="Especialidades (opcional)" [(ngModel)]="specialties" name="specialties" />
        <nutri-input label="Bio (opcional)" type="textarea" [(ngModel)]="bio" name="bio" />
      }

      <nutri-input label="Senha" type="password" [(ngModel)]="password" name="password" />
      <nutri-button variant="primary" type="submit" [block]="true" [disabled]="auth.loading() || loadingFlags()">
        @if (auth.loading()) {
          Enviando...
        } @else if (registrationOpen()) {
          Cadastrar
        } @else {
          Solicitar participação no beta
        }
      </nutri-button>
    </form>
    @if (showFooterLinks && registrationOpen()) {
      <p class="beta-form__footer">
        Já tem conta? <a routerLink="/auth/login">Entrar</a>
        · É nutricionista? <a routerLink="/auth/cadastro-nutricionista">Cadastro Pro</a>
      </p>
    }
    @if (showFooterLinks && !registrationOpen()) {
      <p class="beta-form__footer">
        Já tem conta? <a routerLink="/auth/login">Entrar</a>
      </p>
    }
  `,
  styles: `
    .beta-form__title { margin: 0 0 8px; font-size: 1.35rem; }
    .beta-form__subtitle { margin: 0 0 16px; color: var(--nutri-text-muted, #5c6b63); line-height: 1.5; }
    .beta-form__error { margin-bottom: 12px; padding: 10px 12px; border-radius: 8px; background: #fdecea; color: #b42318; font-size: 0.9rem; }
    .beta-form__footer { margin-top: 16px; font-size: 0.9rem; color: var(--nutri-text-muted, #5c6b63); }
    .beta-form__profile { border: 0; margin: 0 0 16px; padding: 0; display: grid; gap: 8px; }
    .beta-form__profile legend { font-weight: 700; margin-bottom: 4px; padding: 0; }
    .beta-form__profile-option { display: flex; align-items: flex-start; gap: 8px; font-size: 0.95rem; line-height: 1.4; cursor: pointer; }
  `,
})
export class BetaSignupFormComponent implements OnInit {
  @Input() showTitle = true;
  @Input() showFooterLinks = true;
  @Input() analyticsLocation = 'beta_form';
  @Output() submitted = new EventEmitter<void>();

  readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly featureFlags = inject(FeatureFlagService);
  private readonly analytics = inject(AnalyticsService);
  private readonly campaign = inject(CampaignAttributionService);

  readonly registrationOpen = signal(true);
  readonly loadingFlags = signal(true);

  profileType: BetaProfileType = 'patient';
  name = '';
  email = '';
  password = '';
  cpf = '';
  phone = '';
  birthDate = '';
  crn = '';
  specialties = '';
  bio = '';
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

  onPhoneChange(value: string): void {
    this.phone = formatPhoneInput(value);
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
    if (!isValidBrazilPhone(this.phone)) {
      this.validationError = 'Informe um telefone válido com DDD.';
      return;
    }
    if (!isValidCpf(this.cpf)) {
      this.validationError = 'CPF inválido.';
      return;
    }

    const isNutritionistBeta = !this.registrationOpen() && this.profileType === 'nutritionist';
    const minPassword = isNutritionistBeta ? 8 : 6;
    if (this.password.length < minPassword) {
      this.validationError = `A senha deve ter pelo menos ${minPassword} caracteres.`;
      return;
    }

    if (!isNutritionistBeta) {
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
    } else if (!this.crn.trim()) {
      this.validationError = 'Informe seu CRN.';
      return;
    }

    const attribution = this.campaign.payload();
    const contactPhone = phoneDigitsOnly(this.phone);
    const mode: RegistrationMode = this.registrationOpen() ? 'open' : 'beta';

    this.analytics.trackBetaSignupStart(mode, this.analyticsLocation, attribution);
    try {
      if (isNutritionistBeta) {
        await this.auth.betaRequestNutritionist({
          name: this.name.trim(),
          email: this.email.trim(),
          password: this.password,
          cpf: cpfDigitsOnly(this.cpf),
          contactPhone,
          crn: this.crn.trim(),
          bio: this.bio.trim() || undefined,
          specialties: this.specialties.trim() || undefined,
        });
      } else {
        const payload = {
          name: this.name.trim(),
          email: this.email.trim(),
          password: this.password,
          cpf: cpfDigitsOnly(this.cpf),
          birthDate: this.birthDate,
          contactPhone,
          ...attribution,
        };
        if (this.registrationOpen()) {
          await this.auth.registerWithAttribution(payload);
        } else {
          await this.auth.betaRequestWithAttribution(payload);
        }
      }
      this.analytics.trackBetaSignupComplete(mode, this.analyticsLocation, attribution);
      this.submitted.emit();
      this.router.navigateByUrl('/auth/login', {
        state: {
          registerMessage: this.auth.registerMessage() ?? 'Cadastro recebido. Aguarde a liberação do acesso.',
        },
      });
    } catch {
      const error = this.auth.error();
      this.analytics.trackBetaSignupError(error ?? 'signup_failed', mode, this.analyticsLocation, attribution);
    }
  }
}

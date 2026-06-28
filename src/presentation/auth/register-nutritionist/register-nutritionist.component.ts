import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { AuthFacade } from '../../core/auth.facade';
import { cpfDigitsOnly, formatCpfInput, formatPhoneInput, isValidBrazilPhone, isValidCpf, phoneDigitsOnly } from '../../core/date.util';
import { PRO_PRODUCT_NAME } from '../../core/constants';
import { FeatureFlagService } from '../../../infrastructure/http/feature-flag.service';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';
import { RegistrationMode } from '../../../domain/analytics/analytics.model';

@Component({
  selector: 'app-register-nutritionist',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    NutriLogoComponent,
    NutriButtonComponent,
    NutriInputComponent,
    NutriInfoTipComponent,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-card auth-card--wide">
        <div class="auth-card__logo"><nutri-logo /></div>
        @if (registrationOpen()) {
          <h1>Cadastro Nutricionista</h1>
          <p class="auth-card__subtitle">Acesse o portal {{ proProductName }}</p>
        } @else {
          <h1>Beta Nutri+ Pro</h1>
          <p class="auth-card__subtitle">
            Estamos selecionando nutricionistas para o teste beta. Solicite participação para validarmos seu perfil.
          </p>
        }
        <nutri-info-tip message="Seu CRN será verificado pela equipe antes da publicação no marketplace." />
        @if (validationError) {
          <div class="auth-card__error" role="alert">{{ validationError }}</div>
        }
        @if (auth.error()) {
          <div class="auth-card__error" role="alert">{{ auth.error() }}</div>
        }
        <form (ngSubmit)="submit()">
          <nutri-input label="Nome completo" [(ngModel)]="name" name="name" />
          <nutri-input label="E-mail" type="email" [(ngModel)]="email" name="email" />
          <nutri-input label="Telefone / WhatsApp" [(ngModel)]="phone" name="phone" placeholder="(11) 98765-4321" (ngModelChange)="onPhoneChange($event)" />
          <nutri-input label="CPF" [(ngModel)]="cpf" name="cpf" placeholder="000.000.000-00" (ngModelChange)="onCpfChange($event)" />
          <nutri-input label="CRN" [(ngModel)]="crn" name="crn" placeholder="Ex: CRN-3 12345" />
          <nutri-input label="Senha" type="password" [(ngModel)]="password" name="password" />
          <nutri-input label="Especialidades" [(ngModel)]="specialties" name="specialties" placeholder="Ex: Esportiva, clínica" />
          <nutri-input label="Bio" type="textarea" [(ngModel)]="bio" name="bio" placeholder="Apresentação breve" />
          <nutri-button variant="primary" type="submit" [block]="true" [disabled]="auth.loading() || loadingFlags()">
            @if (auth.loading()) {
              Enviando...
            } @else if (registrationOpen()) {
              Criar conta Pro
            } @else {
              Solicitar participação no beta
            }
          </nutri-button>
        </form>
        <p class="auth-card__footer">
          Já tem conta? <a routerLink="/auth/login">Entrar</a>
          · É paciente?
          @if (registrationOpen()) {
            <a routerLink="/auth/cadastro">Cadastro paciente</a>
          } @else {
            <a routerLink="/beta">Participar do beta</a>
          }
        </p>
      </div>
    </div>
  `,
  styleUrl: '../auth-layout.scss',
})
export class RegisterNutritionistComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  readonly proProductName = PRO_PRODUCT_NAME;
  private readonly router = inject(Router);
  private readonly featureFlags = inject(FeatureFlagService);
  private readonly analytics = inject(AnalyticsService);

  readonly registrationOpen = signal(true);
  readonly loadingFlags = signal(true);

  name = '';
  email = '';
  password = '';
  cpf = '';
  phone = '';
  crn = '';
  bio = '';
  specialties = '';
  validationError = '';

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
    if (!isValidCpf(this.cpf)) {
      this.validationError = 'CPF inválido.';
      return;
    }
    if (!isValidBrazilPhone(this.phone)) {
      this.validationError = 'Informe um telefone válido com DDD.';
      return;
    }
    if (this.password.length < 8) {
      this.validationError = 'A senha deve ter pelo menos 8 caracteres.';
      return;
    }
    const data = {
      name: this.name,
      email: this.email,
      password: this.password,
      cpf: cpfDigitsOnly(this.cpf),
      contactPhone: phoneDigitsOnly(this.phone),
      crn: this.crn.trim(),
      bio: this.bio.trim() || undefined,
      specialties: this.specialties.trim() || undefined,
    };
    const mode: RegistrationMode = this.registrationOpen() ? 'open' : 'beta';
    this.analytics.trackSignUpProStart(mode);
    try {
      if (this.registrationOpen()) {
        await this.auth.registerNutritionist(data);
      } else {
        await this.auth.betaRequestNutritionist(data);
      }
      this.analytics.trackSignUpPro(mode);
      this.router.navigateByUrl('/auth/login', {
        state: { registerMessage: this.auth.registerMessage() ?? 'Cadastro recebido. Aguarde a liberação do acesso.' },
      });
    } catch {
      const error = this.auth.error();
      this.analytics.trackSignUpProError(error ?? 'signup_pro_failed', mode);
    }
  }
}

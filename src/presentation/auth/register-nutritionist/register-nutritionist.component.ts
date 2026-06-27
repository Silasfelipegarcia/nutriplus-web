import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { AuthFacade } from '../../core/auth.facade';
import { cpfDigitsOnly, formatCpfInput, isValidCpf } from '../../core/date.util';

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
        <h1>Cadastro Nutricionista</h1>
        <p class="auth-card__subtitle">Acesse o portal Pro do Nutri+</p>
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
          <nutri-input label="CPF" [(ngModel)]="cpf" name="cpf" placeholder="000.000.000-00" (ngModelChange)="onCpfChange($event)" />
          <nutri-input label="CRN" [(ngModel)]="crn" name="crn" placeholder="Ex: CRN-3 12345" />
          <nutri-input label="Senha" type="password" [(ngModel)]="password" name="password" />
          <nutri-input label="Especialidades" [(ngModel)]="specialties" name="specialties" placeholder="Ex: Esportiva, clínica" />
          <nutri-input label="Bio" type="textarea" [(ngModel)]="bio" name="bio" placeholder="Apresentação breve" />
          <nutri-button variant="primary" type="submit" [block]="true" [disabled]="auth.loading()">
            {{ auth.loading() ? 'Cadastrando...' : 'Criar conta Pro' }}
          </nutri-button>
        </form>
        <p class="auth-card__footer">
          Já tem conta? <a routerLink="/auth/login">Entrar</a>
          · É paciente? <a routerLink="/auth/cadastro">Cadastro paciente</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: '../auth-layout.scss',
})
export class RegisterNutritionistComponent {
  readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  name = '';
  email = '';
  password = '';
  cpf = '';
  crn = '';
  bio = '';
  specialties = '';
  validationError = '';

  onCpfChange(value: string): void {
    this.cpf = formatCpfInput(value);
    this.validationError = '';
  }

  async submit(): Promise<void> {
    this.validationError = '';
    if (!isValidCpf(this.cpf)) {
      this.validationError = 'CPF inválido.';
      return;
    }
    if (this.password.length < 8) {
      this.validationError = 'A senha deve ter pelo menos 8 caracteres.';
      return;
    }
    try {
      await this.auth.registerNutritionist({
        name: this.name,
        email: this.email,
        password: this.password,
        cpf: cpfDigitsOnly(this.cpf),
        crn: this.crn.trim(),
        bio: this.bio.trim() || undefined,
        specialties: this.specialties.trim() || undefined,
      });
      this.router.navigateByUrl('/pro/dashboard');
    } catch {
      // error shown via facade
    }
  }
}

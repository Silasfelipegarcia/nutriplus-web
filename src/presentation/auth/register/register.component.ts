import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { AuthFacade } from '../../core/auth.facade';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, NutriLogoComponent, NutriButtonComponent, NutriInputComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__logo"><nutri-logo /></div>
        <h1>Criar conta</h1>
        <p class="auth-card__subtitle">Comece sua jornada alimentar</p>
        @if (auth.error()) {
          <div class="auth-card__error" role="alert">{{ auth.error() }}</div>
        }
        <form (ngSubmit)="submit()">
          <nutri-input label="Nome" [(ngModel)]="name" name="name" />
          <nutri-input label="E-mail" type="email" [(ngModel)]="email" name="email" />
          <nutri-input label="Senha" type="password" [(ngModel)]="password" name="password" />
          <nutri-button variant="primary" type="submit" [block]="true" [disabled]="auth.loading()">
            {{ auth.loading() ? 'Cadastrando...' : 'Cadastrar' }}
          </nutri-button>
        </form>
        <p class="auth-card__footer">
          Já tem conta? <a routerLink="/auth/login">Entrar</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: '../auth-layout.scss',
})
export class RegisterComponent {
  readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  name = '';
  email = '';
  password = '';

  async submit(): Promise<void> {
    try {
      await this.auth.register(this.name, this.email, this.password);
      this.router.navigateByUrl('/onboarding');
    } catch {
      // error shown via facade
    }
  }
}

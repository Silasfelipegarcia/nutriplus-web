import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { AuthFacade } from '../../core/auth.facade';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, NutriLogoComponent, NutriButtonComponent, NutriInputComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__logo"><nutri-logo /></div>
        <h1>Entrar</h1>
        <p class="auth-card__subtitle">Acesse seu portal Nutri+</p>
        @if (auth.error()) {
          <div class="auth-card__error" role="alert">{{ auth.error() }}</div>
        }
        <form (ngSubmit)="submit()">
          <nutri-input label="E-mail" type="email" [(ngModel)]="email" name="email" />
          <nutri-input label="Senha" type="password" [(ngModel)]="password" name="password" />
          <nutri-button variant="primary" type="submit" [block]="true" [disabled]="auth.loading()">
            {{ auth.loading() ? 'Entrando...' : 'Entrar' }}
          </nutri-button>
        </form>
        <p class="auth-card__footer">
          Não tem conta? <a routerLink="/auth/cadastro">Cadastre-se</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: '../auth-layout.scss',
})
export class LoginComponent {
  readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  email = '';
  password = '';

  async submit(): Promise<void> {
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigateByUrl(this.postLoginRoute());
    } catch {
      // error shown via facade
    }
  }

  private postLoginRoute(): string {
    if (this.auth.needsOnboarding()) return '/onboarding';
    if (this.auth.needsTerms()) return '/onboarding/termos';
    return '/app/dashboard';
  }
}

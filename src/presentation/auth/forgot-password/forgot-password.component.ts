import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { HttpAuthRepository } from '../../../infrastructure/http/http-auth.repository';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';
import { localizeAuthErrorMessage } from '../../core/auth-error-messages';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, NutriLogoComponent, NutriButtonComponent, NutriInputComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__logo"><nutri-logo /></div>
        <h1>Esqueci minha senha</h1>
        <p class="auth-card__subtitle">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
        @if (successMessage()) {
          <div class="auth-card__info" role="status">{{ successMessage() }}</div>
        }
        @if (errorMessage()) {
          <div class="auth-card__error" role="alert">{{ errorMessage() }}</div>
        }
        @if (!successMessage()) {
          <form (ngSubmit)="submit()">
            <nutri-input label="E-mail" type="email" [(ngModel)]="email" name="email" />
            <nutri-button variant="primary" type="submit" [block]="true" [disabled]="loading()">
              {{ loading() ? 'Enviando...' : 'Enviar link' }}
            </nutri-button>
          </form>
        }
        <p class="auth-card__footer">
          <a routerLink="/auth/login">Voltar ao login</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: '../auth-layout.scss',
})
export class ForgotPasswordComponent {
  private readonly authRepo = inject(HttpAuthRepository);
  private readonly analytics = inject(AnalyticsService);

  email = '';
  readonly loading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  async submit(): Promise<void> {
    if (this.loading()) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.email.includes('@')) {
      this.errorMessage.set('Informe um e-mail válido.');
      return;
    }

    this.loading.set(true);
    this.analytics.trackPasswordResetRequest();
    try {
      const message = await this.authRepo.forgotPassword(this.email.trim());
      this.successMessage.set(message);
      this.analytics.trackPasswordResetRequestSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível enviar o e-mail.';
      this.errorMessage.set(localizeAuthErrorMessage(message));
      this.analytics.trackPasswordResetRequestError(message);
    } finally {
      this.loading.set(false);
    }
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { HttpAuthRepository } from '../../../infrastructure/http/http-auth.repository';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';
import { localizeAuthErrorMessage } from '../../core/auth-error-messages';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, NutriLogoComponent, NutriButtonComponent, NutriInputComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__logo"><nutri-logo /></div>
        <h1>Redefinir senha</h1>
        @if (tokenInvalid()) {
          <div class="auth-card__error" role="alert">
            Link inválido ou expirado. Solicite um novo link de redefinição.
          </div>
          <p class="auth-card__footer">
            <a routerLink="/auth/esqueci-senha">Solicitar novo link</a>
            · <a routerLink="/auth/login">Voltar ao login</a>
          </p>
        } @else if (success()) {
          <div class="auth-card__info" role="status">
            Senha atualizada com sucesso. Redirecionando para o login...
          </div>
        } @else {
          <p class="auth-card__subtitle">Defina uma nova senha para sua conta.</p>
          @if (errorMessage()) {
            <div class="auth-card__error" role="alert">{{ errorMessage() }}</div>
          }
          <form (ngSubmit)="submit()">
            <nutri-input label="Nova senha" type="password" [(ngModel)]="newPassword" name="newPassword" />
            <nutri-input label="Confirmar senha" type="password" [(ngModel)]="confirmPassword" name="confirmPassword" />
            <nutri-button variant="primary" type="submit" [block]="true" [disabled]="loading()">
              {{ loading() ? 'Salvando...' : 'Redefinir senha' }}
            </nutri-button>
          </form>
          <p class="auth-card__footer">
            <a routerLink="/auth/login">Voltar ao login</a>
          </p>
        }
      </div>
    </div>
  `,
  styleUrl: '../auth-layout.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authRepo = inject(HttpAuthRepository);
  private readonly analytics = inject(AnalyticsService);

  token = '';
  newPassword = '';
  confirmPassword = '';
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly tokenInvalid = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.tokenInvalid.set(true);
      return;
    }
    this.token = token;
  }

  async submit(): Promise<void> {
    if (this.loading() || this.tokenInvalid()) return;
    this.errorMessage.set(null);

    if (this.newPassword.length < 6) {
      this.analytics.trackPasswordResetCompleteError('validation_password_short');
      this.errorMessage.set('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.analytics.trackPasswordResetCompleteError('validation_password_mismatch');
      this.errorMessage.set('As senhas não coincidem.');
      return;
    }

    this.loading.set(true);
    try {
      await this.authRepo.resetPassword(this.token, this.newPassword);
      this.success.set(true);
      this.analytics.trackPasswordResetComplete();
      setTimeout(() => void this.router.navigateByUrl('/auth/login'), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível redefinir a senha.';
      this.errorMessage.set(localizeAuthErrorMessage(message));
      this.analytics.trackPasswordResetCompleteError(message);
      const lower = message.toLowerCase();
      if (lower.includes('inválido') || lower.includes('expirado')) {
        this.tokenInvalid.set(true);
      }
    } finally {
      this.loading.set(false);
    }
  }
}

import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { HOUSEHOLD_REPOSITORY } from '../../../domain/repositories/household.repository';

@Component({
  selector: 'app-share-plan-family',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent, NutriInputComponent],
  template: `
  <div class="portal-confirm-overlay" (click)="closed.emit()" role="presentation">
    <div class="portal-confirm-dialog" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
      <h2>Compartilhar plano com família</h2>
      <p>
        Convide quem mora com você para seguir o mesmo cardápio — mesmos alimentos e horários, com porções
        ajustadas ao perfil de cada um.
      </p>
      <nutri-input label="Nome (opcional)" [(ngModel)]="name" name="inviteeName" />
      <nutri-input label="E-mail" type="email" [(ngModel)]="email" name="inviteeEmail" />
      @if (error()) {
        <div class="auth-card__error">{{ error() }}</div>
      }
      @if (inviteUrl()) {
        <p class="portal-card portal-card--highlight">
          Convite enviado! Link: <a [href]="inviteUrl()!" target="_blank" rel="noopener">{{ inviteUrl() }}</a>
        </p>
      }
      <div class="portal-confirm-dialog__actions">
        <nutri-button variant="ghost" (click)="closed.emit()">Cancelar</nutri-button>
        <nutri-button variant="primary" [disabled]="saving()" (click)="send()">
          {{ saving() ? 'Enviando...' : 'Enviar convite' }}
        </nutri-button>
      </div>
    </div>
  </div>
  `,
  styleUrl: '../../portal/portal.scss',
})
export class SharePlanFamilyComponent {
  private readonly householdRepo = inject(HOUSEHOLD_REPOSITORY);

  readonly mealPlanId = input<number | null>(null);
  readonly closed = output<void>();
  readonly invited = output<string>();

  name = '';
  email = '';
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly inviteUrl = signal<string | null>(null);

  async send(): Promise<void> {
    const trimmedEmail = this.email.trim();
    if (!trimmedEmail) {
      this.error.set('Informe o e-mail da pessoa.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const planId = this.mealPlanId();
      await this.householdRepo.shareMealPlan(planId ?? undefined);
      const created = await this.householdRepo.createInvitation(
        trimmedEmail,
        this.name.trim() || undefined,
      );
      this.inviteUrl.set(created.inviteUrl);
      this.invited.emit(trimmedEmail);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Não foi possível enviar o convite.');
    } finally {
      this.saving.set(false);
    }
  }
}

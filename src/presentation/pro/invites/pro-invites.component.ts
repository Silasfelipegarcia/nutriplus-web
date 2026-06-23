import { Component, inject, signal } from '@angular/core';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { PRO_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { ProInvite } from '../../../domain/entities';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';

@Component({
  selector: 'app-pro-invites',
  standalone: true,
  imports: [NutriButtonComponent, NutriInfoTipComponent],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Convites</h1>
        <p>Gere links para pacientes entrarem em pré-consulta.</p>
      </div>
      <nutri-info-tip message="O paciente aceita o convite em /convite/CODIGO e compartilha dados com consentimento LGPD." />
      <div class="portal-actions">
        <nutri-button variant="primary" [disabled]="creating" (click)="create()">
          {{ creating ? 'Gerando...' : 'Gerar convite' }}
        </nutri-button>
      </div>
      @if (invite()) {
        <div class="portal-card portal-card--highlight">
          <p><strong>Código:</strong> {{ invite()!.code }}</p>
          <p><strong>Link:</strong> {{ invite()!.inviteUrl }}</p>
          <p><strong>Usos:</strong> {{ invite()!.useCount }} / {{ invite()!.maxUses }}</p>
        </div>
      }
    </div>
  `,
  styleUrl: '../../portal/portal.scss',
})
export class ProInvitesComponent {
  private readonly proRepo = inject(PRO_REPOSITORY);
  private readonly toast = inject(NutriToastService);
  readonly invite = signal<ProInvite | null>(null);
  creating = false;

  async create(): Promise<void> {
    this.creating = true;
    await withActionFeedback(
      this.toast,
      async () => {
        this.invite.set(await this.proRepo.createInvite());
      },
      { success: 'Convite gerado' },
    );
    this.creating = false;
  }
}

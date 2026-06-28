import { Component, inject, signal } from '@angular/core';
import { AdminApiService, NutritionistPending } from '../../infrastructure/http/admin-api.service';
import { AdminPageHeaderComponent } from './admin-page-header.component';

@Component({
  selector: 'app-admin-nutritionists',
  standalone: true,
  imports: [AdminPageHeaderComponent],
  template: `
    <app-admin-page-header
      title="Verificação CRN"
      subtitle="Revise documentos e libere nutricionistas para o marketplace."
      eyebrow="Operações"
    />

    @if (error()) {
      <div class="admin-page__error" role="alert">{{ error() }}</div>
    }

    <section class="admin-section">
      <div class="admin-section__head">
        <h2>Fila de verificação</h2>
      </div>
      <div class="admin-card admin-table-wrap">
        @if (pending().length === 0) {
          <p class="admin-empty">Nenhum nutricionista pendente.</p>
        } @else {
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>CRN</th>
                <th>CPF</th>
                <th>Marketplace</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (n of pending(); track n.nutritionistId) {
                <tr>
                  <td>{{ n.name }}</td>
                  <td>{{ n.email }}</td>
                  <td>{{ n.crn }}</td>
                  <td>{{ n.cpfMasked }}</td>
                  <td>{{ n.marketplaceVisible ? 'Visível' : 'Oculto' }}</td>
                  <td>
                    <button
                      type="button"
                      class="admin-btn"
                      (click)="verify(n)"
                      [disabled]="busyId() === n.nutritionistId"
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      class="admin-btn admin-btn--danger"
                      (click)="reject(n)"
                      [disabled]="busyId() === n.nutritionistId"
                    >
                      Rejeitar
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </section>

    @if (rejectTarget(); as n) {
      <div class="admin-modal-backdrop" role="presentation" (click)="closeRejectDialog()"></div>
      <div class="admin-modal" role="dialog" aria-labelledby="reject-nutri-title" aria-modal="true">
        <h3 id="reject-nutri-title">Recusar verificação CRN</h3>
        <p class="admin-modal__lead">
          A verificação de <strong>{{ n.email }}</strong> será recusada e a pessoa receberá um e-mail.
        </p>
        <label class="admin-modal__field">
          Motivo (opcional)
          <textarea
            rows="3"
            maxlength="500"
            placeholder="Ex.: CRN não confere com o cadastro"
            [value]="rejectReason()"
            (input)="rejectReason.set($any($event.target).value)"
          ></textarea>
        </label>
        <div class="admin-modal__actions">
          <button type="button" class="admin-btn admin-btn--secondary" (click)="closeRejectDialog()">Cancelar</button>
          <button
            type="button"
            class="admin-btn admin-btn--danger"
            (click)="confirmReject()"
            [disabled]="busyId() === n.nutritionistId"
          >
            Confirmar recusa
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './admin.scss',
})
export class AdminNutritionistsComponent {
  private readonly adminApi = inject(AdminApiService);

  readonly pending = signal<NutritionistPending[]>([]);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);
  readonly rejectTarget = signal<NutritionistPending | null>(null);
  readonly rejectReason = signal('');

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    try {
      this.pending.set(await this.adminApi.pendingNutritionists());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar nutricionistas');
    }
  }

  async verify(n: NutritionistPending): Promise<void> {
    this.busyId.set(n.nutritionistId);
    try {
      await this.adminApi.verifyNutritionist(n.nutritionistId);
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao aprovar nutricionista');
    } finally {
      this.busyId.set(null);
    }
  }

  async reject(n: NutritionistPending): Promise<void> {
    this.rejectReason.set('');
    this.rejectTarget.set(n);
  }

  closeRejectDialog(): void {
    if (this.busyId() !== null) return;
    this.rejectTarget.set(null);
    this.rejectReason.set('');
  }

  async confirmReject(): Promise<void> {
    const n = this.rejectTarget();
    if (!n) return;
    this.busyId.set(n.nutritionistId);
    try {
      await this.adminApi.rejectNutritionist(n.nutritionistId, this.rejectReason());
      this.rejectTarget.set(null);
      this.rejectReason.set('');
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao rejeitar nutricionista');
    } finally {
      this.busyId.set(null);
    }
  }
}

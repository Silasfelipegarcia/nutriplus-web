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
  `,
  styleUrl: './admin.scss',
})
export class AdminNutritionistsComponent {
  private readonly adminApi = inject(AdminApiService);

  readonly pending = signal<NutritionistPending[]>([]);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

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
    if (!confirm(`Rejeitar verificação de ${n.email}?`)) return;
    this.busyId.set(n.nutritionistId);
    try {
      await this.adminApi.rejectNutritionist(n.nutritionistId);
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao rejeitar nutricionista');
    } finally {
      this.busyId.set(null);
    }
  }
}

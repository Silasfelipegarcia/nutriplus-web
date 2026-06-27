import { Component, inject, signal } from '@angular/core';
import { AdminApiService, FeatureFlag } from '../../infrastructure/http/admin-api.service';
import { AdminPageHeaderComponent } from './admin-page-header.component';

@Component({
  selector: 'app-admin-flags',
  standalone: true,
  imports: [AdminPageHeaderComponent],
  template: `
    <app-admin-page-header
      title="Feature flags"
      subtitle="Controle funcionalidades do app em tempo real, sem novo deploy."
      eyebrow="Plataforma"
    />

    @if (error()) {
      <div class="admin-page__error" role="alert">{{ error() }}</div>
    }

    <section class="admin-section">
      <div class="admin-flags">
        @for (flag of flags(); track flag.code) {
          <article class="admin-flag">
            <div>
              <strong>{{ flag.name }}</strong>
              <p>{{ flag.description }}</p>
              <code>{{ flag.code }}</code>
            </div>
            <label class="admin-toggle">
              <input
                type="checkbox"
                [checked]="flag.enabled"
                [disabled]="busyFlag() === flag.code"
                (change)="toggleFlag(flag, $any($event.target).checked)"
              />
              {{ flag.enabled ? 'Ligado' : 'Desligado' }}
            </label>
          </article>
        }
      </div>
    </section>
  `,
  styleUrl: './admin.scss',
})
export class AdminFlagsComponent {
  private readonly adminApi = inject(AdminApiService);

  readonly flags = signal<FeatureFlag[]>([]);
  readonly error = signal<string | null>(null);
  readonly busyFlag = signal<string | null>(null);

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    try {
      this.flags.set(await this.adminApi.featureFlags());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar funcionalidades');
    }
  }

  async toggleFlag(flag: FeatureFlag, enabled: boolean): Promise<void> {
    this.busyFlag.set(flag.code);
    try {
      await this.adminApi.updateFeatureFlag(flag.code, enabled);
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao atualizar funcionalidade');
    } finally {
      this.busyFlag.set(null);
    }
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminSubscriptionPlan } from '../../infrastructure/http/admin-api.service';
import { AdminPageHeaderComponent } from './admin-page-header.component';

interface PlanDraft {
  name: string;
  description: string;
  priceReais: string;
  periodDays: number;
  priceSuffix: string;
  benefitsText: string;
  trialAvailable: boolean;
  contactSales: boolean;
  enabled: boolean;
  visibleInCatalog: boolean;
  sortOrder: number;
}

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [FormsModule, AdminPageHeaderComponent],
  template: `
    <app-admin-page-header
      title="Planos de assinatura"
      subtitle="Edite nomes, preços e benefícios. Os apps e a web usam estes valores automaticamente."
      eyebrow="Monetização"
    />

    @if (error()) {
      <div class="admin-page__error" role="alert">{{ error() }}</div>
    }
    @if (message()) {
      <div class="admin-page__success" role="status">{{ message() }}</div>
    }

    <p class="admin-hint">
      Para exigir assinatura paga, ligue a feature flag
      <strong>Cobrança de planos</strong> (<code>SUBSCRIPTION_BILLING</code>) em Feature flags.
    </p>

    <section class="admin-section">
      @for (plan of plans(); track plan.id) {
        <article class="admin-plan-card">
          <header class="admin-plan-card__head">
            <div>
              <strong>{{ plan.planCode }}</strong>
              <span class="admin-plan-card__meta">Ordem {{ plan.sortOrder }}</span>
            </div>
            @if (busyId() === plan.id) {
              <span>Salvando...</span>
            }
          </header>

          @if (drafts()[plan.id]; as draft) {
            <form class="admin-plan-form" (ngSubmit)="save(plan.id)">
              <label>Nome<input [(ngModel)]="draft.name" [name]="'name-' + plan.id" required /></label>
              <label>Descrição<textarea [(ngModel)]="draft.description" [name]="'desc-' + plan.id" rows="2"></textarea></label>
              <div class="admin-plan-form__row">
                <label>Preço (R$)
                  <input [(ngModel)]="draft.priceReais" [name]="'price-' + plan.id" inputmode="decimal" [disabled]="plan.planCode === 'FREE'" />
                </label>
                <label>Período (dias)
                  <input type="number" min="0" [(ngModel)]="draft.periodDays" [name]="'period-' + plan.id" [disabled]="plan.planCode === 'FREE'" />
                </label>
                <label>Sufixo do preço
                  <input [(ngModel)]="draft.priceSuffix" [name]="'suffix-' + plan.id" placeholder="/mês" />
                </label>
              </div>
              <label>Benefícios (um por linha)
                <textarea [(ngModel)]="draft.benefitsText" [name]="'benefits-' + plan.id" rows="4"></textarea>
              </label>
              <div class="admin-plan-form__checks">
                <label><input type="checkbox" [(ngModel)]="draft.trialAvailable" [name]="'trial-' + plan.id" /> Trial disponível</label>
                <label><input type="checkbox" [(ngModel)]="draft.contactSales" [name]="'contact-' + plan.id" /> Contato comercial</label>
                <label><input type="checkbox" [(ngModel)]="draft.enabled" [name]="'enabled-' + plan.id" /> Habilitado</label>
                <label><input type="checkbox" [(ngModel)]="draft.visibleInCatalog" [name]="'visible-' + plan.id" /> Visível no catálogo</label>
              </div>
              <label>Ordem<input type="number" [(ngModel)]="draft.sortOrder" [name]="'sort-' + plan.id" /></label>
              <button type="submit" class="admin-btn" [disabled]="busyId() === plan.id">Salvar plano</button>
            </form>
          }
        </article>
      }
    </section>
  `,
  styleUrl: './admin.scss',
})
export class AdminPlansComponent {
  private readonly adminApi = inject(AdminApiService);

  readonly plans = signal<AdminSubscriptionPlan[]>([]);
  readonly drafts = signal<Record<number, PlanDraft>>({});
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    try {
      const items = await this.adminApi.subscriptionPlans();
      this.plans.set(items);
      const next: Record<number, PlanDraft> = {};
      for (const plan of items) {
        next[plan.id] = this.toDraft(plan);
      }
      this.drafts.set(next);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao carregar planos');
    }
  }

  async save(id: number): Promise<void> {
    const draft = this.drafts()[id];
    if (!draft) return;

    this.busyId.set(id);
    this.error.set(null);
    this.message.set(null);

    const priceCents = Math.round(parseFloat(draft.priceReais.replace(',', '.')) * 100);
    if (Number.isNaN(priceCents) || priceCents < 0) {
      this.error.set('Informe um preço válido.');
      this.busyId.set(null);
      return;
    }

    try {
      await this.adminApi.updateSubscriptionPlan(id, {
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        priceCents,
        periodDays: draft.periodDays,
        priceSuffix: draft.priceSuffix.trim() || undefined,
        benefits: draft.benefitsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        trialAvailable: draft.trialAvailable,
        contactSales: draft.contactSales,
        enabled: draft.enabled,
        visibleInCatalog: draft.visibleInCatalog,
        sortOrder: draft.sortOrder,
      });
      this.message.set('Plano atualizado.');
      await this.reload();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao salvar plano');
    } finally {
      this.busyId.set(null);
    }
  }

  private toDraft(plan: AdminSubscriptionPlan): PlanDraft {
    return {
      name: plan.name,
      description: plan.description ?? '',
      priceReais: (plan.priceCents / 100).toFixed(2).replace('.', ','),
      periodDays: plan.periodDays,
      priceSuffix: plan.priceSuffix ?? '',
      benefitsText: (plan.benefits ?? []).join('\n'),
      trialAvailable: plan.trialAvailable,
      contactSales: plan.contactSales,
      enabled: plan.enabled,
      visibleInCatalog: plan.visibleInCatalog,
      sortOrder: plan.sortOrder,
    };
  }
}

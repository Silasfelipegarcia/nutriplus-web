import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriEmptyStateComponent } from '../../../design-system/nutri-empty-state/nutri-empty-state.component';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { BodyMeasurement, EvolutionMetric, EvolutionReport } from '../../../domain/entities';
import { isNotFound } from '../../../infrastructure/http/api-error';

const STATUS_COLORS: Record<string, string> = {
  EXCELLENT: '#2e7d4f',
  GOOD: '#3b82a0',
  OK: '#d4a017',
  BELOW: '#c45c4a',
};

const STATUS_LABELS: Record<string, string> = {
  EXCELLENT: 'Ótimo',
  GOOD: 'Acima',
  OK: 'Ok',
  BELOW: 'Abaixo',
};

@Component({
  selector: 'app-evolution',
  standalone: true,
  imports: [DecimalPipe, RouterLink, NutriButtonComponent, NutriEmptyStateComponent],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Evolução</h1>
        <p>Relatório de longo prazo com histórico de medições.</p>
      </div>

    @if (report()) {
      @if (report()!.headline) {
        <section class="evolution-hero">
          <h2>{{ report()!.headline }}</h2>
          @if (statusChips().length) {
            <div class="evolution-chips">
              @for (chip of statusChips(); track chip.label) {
                <span class="evolution-chip" [style.--chip-color]="chip.color">
                  {{ chip.label }}: {{ chip.count }}
                </span>
              }
            </div>
          }
          @if (heroMeta()) {
            <p class="evolution-hero__meta">{{ heroMeta() }}</p>
          }
        </section>
      }

      @if (report()!.weekAdherencePercent != null || report()!.currentStreak != null) {
        <div class="evolution-summary">
          @if (report()!.weekAdherencePercent != null) {
            <div class="stat-card">
              <strong>{{ report()!.weekAdherencePercent }}%</strong>
              <span>Aderência semanal</span>
            </div>
          }
          @if (report()!.currentStreak != null) {
            <div class="stat-card">
              <strong>{{ report()!.currentStreak }}</strong>
              <span>Dias seguidos</span>
            </div>
          }
          @if (report()!.targetWeightKg != null) {
            <div class="stat-card">
              <strong>{{ report()!.targetWeightKg | number:'1.1-1' }} kg</strong>
              <span>Peso meta</span>
            </div>
          }
        </div>
      }

      @if (report()!.metrics.length) {
        <section class="evolution-legend">
          <h3>Como ler sua evolução</h3>
          <p>Os indicadores medem progresso em direção ao seu objetivo pessoal.</p>
          @for (item of legendItems; track item.status) {
            <div class="evolution-legend__row" [style.--legend-color]="item.color">
              <strong>{{ item.label }}</strong>
              <span>{{ item.desc }}</span>
            </div>
          }
        </section>

        <div class="evolution-metrics">
          @for (m of report()!.metrics; track m.key ?? m.label) {
            <article class="evolution-metric" [style.--metric-color]="metricColor(m)">
              <div class="evolution-metric__accent"></div>
              <div class="evolution-metric__content">
                <div class="evolution-metric__header">
                  <h3>{{ m.label }}</h3>
                  <span class="evolution-metric__badge">{{ m.statusLabel ?? statusLabel(m.status) }}</span>
                </div>
                @if (m.current != null) {
                  <div class="evolution-metric__value">
                    <strong>{{ m.current | number:'1.1-1' }} {{ m.unit }}</strong>
                    @if (m.delta != null) {
                      <span class="evolution-metric__delta">
                        {{ m.delta > 0 ? '+' : '' }}{{ m.delta | number:'1.1-1' }} {{ m.unit }}
                      </span>
                    }
                  </div>
                } @else {
                  <p class="evolution-metric__meta">Sem medição recente</p>
                }
                @if (m.baseline != null) {
                  <p class="evolution-metric__meta">
                    Início: {{ m.baseline | number:'1.1-1' }} {{ m.unit }}
                  </p>
                }
                @if (m.target != null) {
                  <p class="evolution-metric__meta">
                    Meta: {{ m.target | number:'1.1-1' }} {{ m.unit }}
                  </p>
                }
                @if (m.insight) {
                  <p class="evolution-metric__insight">{{ m.insight }}</p>
                }
              </div>
            </article>
          }
        </div>
      }

      @if (history().length) {
        <h2 class="evolution-section-title">Histórico de medições</h2>
        <div class="evolution-history">
          <div class="evolution-history__row evolution-history__head">
            <span>Data</span>
            <span>Peso</span>
            <span>Detalhes</span>
          </div>
          @for (h of history(); track h.measuredOn) {
            <div class="evolution-history__row">
              <span>{{ formatDate(h.measuredOn) }}</span>
              <span>{{ h.weightKg | number:'1.1-1' }} kg</span>
              <span>{{ measurementDetails(h) }}</span>
            </div>
          }
        </div>
      } @else if (!report()!.hasMeasurements) {
        <nutri-empty-state
          icon="📏"
          title="Nenhuma medição ainda"
          message="Registre sua primeira medição em Progresso para comparar sua evolução ao longo do tempo."
        >
          <div class="evolution-empty-cta">
            <nutri-button variant="primary" to="/app/progresso">Registrar medição</nutri-button>
          </div>
        </nutri-empty-state>
      }
    } @else if (!loading()) {
      <nutri-empty-state
        icon="📈"
        title="Sem dados de evolução"
        message="Registre medições para gerar seu relatório de evolução."
      >
        <div class="evolution-empty-cta">
          <nutri-button variant="primary" to="/app/progresso">Ir para Progresso</nutri-button>
        </div>
      </nutri-empty-state>
    }

    @if (loading()) {
      <p class="loading-text">Carregando...</p>
    }
    </div>
  `,
  styleUrls: ['./evolution.component.scss', '../portal.scss'],
})
export class EvolutionComponent implements OnInit {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);

  readonly report = signal<EvolutionReport | null>(null);
  readonly loading = signal(true);

  readonly legendItems = [
    { status: 'EXCELLENT', label: 'Ótimo', color: STATUS_COLORS['EXCELLENT'], desc: 'Acima da meta esperada' },
    { status: 'GOOD', label: 'Acima', color: STATUS_COLORS['GOOD'], desc: 'Evolução positiva na meta' },
    { status: 'OK', label: 'Ok', color: STATUS_COLORS['OK'], desc: 'Dentro do esperado' },
    { status: 'BELOW', label: 'Abaixo', color: STATUS_COLORS['BELOW'], desc: 'Atenção à rotina e aderência' },
  ];

  async ngOnInit(): Promise<void> {
    try {
      this.report.set(await this.nutritionRepo.getEvolutionReport());
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
    this.loading.set(false);
  }

  history(): BodyMeasurement[] {
    const r = this.report();
    if (!r) return [];
    return r.history?.length ? r.history : (r.measurementHistory ?? []);
  }

  statusChips(): { label: string; count: number; color: string }[] {
    const r = this.report();
    if (!r) return [];
    return [
      { label: 'Ótimo', count: r.excellentCount ?? 0, color: STATUS_COLORS['EXCELLENT'] },
      { label: 'Acima', count: r.goodCount ?? 0, color: STATUS_COLORS['GOOD'] },
      { label: 'Ok', count: r.okCount ?? 0, color: STATUS_COLORS['OK'] },
      { label: 'Abaixo', count: r.belowCount ?? 0, color: STATUS_COLORS['BELOW'] },
    ].filter((c) => c.count > 0);
  }

  heroMeta(): string | null {
    const r = this.report();
    if (!r) return null;
    const parts: string[] = [];
    if (r.currentStreak != null && r.currentStreak > 0) {
      parts.push(`${r.currentStreak} dias de streak`);
    }
    if (r.weekAdherencePercent != null) {
      parts.push(`${r.weekAdherencePercent}% aderência na semana`);
    }
    return parts.length ? parts.join(' · ') : null;
  }

  metricColor(m: EvolutionMetric): string {
    return STATUS_COLORS[m.status] ?? STATUS_COLORS['OK'];
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    if (!d) return iso;
    return `${d}/${m}/${y}`;
  }

  measurementDetails(h: BodyMeasurement): string {
    const parts: string[] = [];
    if (h.bodyFatPercent != null) parts.push(`${h.bodyFatPercent}% gordura`);
    if (h.waistCm != null) parts.push(`cintura ${h.waistCm} cm`);
    if (h.notes) parts.push(h.notes);
    return parts.length ? parts.join(' · ') : '—';
  }
}

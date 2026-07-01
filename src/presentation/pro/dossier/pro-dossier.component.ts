import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriAvatarComponent } from '../../../design-system/nutri-avatar/nutri-avatar.component';
import { NutriSectionComponent } from '../../../design-system/nutri-section/nutri-section.component';
import { NutriStatCardComponent } from '../../../design-system/nutri-stat-card/nutri-stat-card.component';
import { PRO_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { MealPlan, PatientDossier, TREND_LABELS } from '../../../domain/entities';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';
import { AnalyticsService } from '../../../infrastructure/analytics/analytics.service';

const GOAL_OPTIONS = [
  { value: 'LOSE_WEIGHT', label: 'Perder peso' },
  { value: 'MAINTAIN_WEIGHT', label: 'Manter peso' },
  { value: 'GAIN_MASS', label: 'Ganhar massa' },
];

const DIET_OPTIONS = [
  { value: 'OMNIVORE', label: 'Onívoro' },
  { value: 'VEGETARIAN', label: 'Vegetariano' },
  { value: 'VEGAN', label: 'Vegano' },
];

@Component({
  selector: 'app-pro-dossier',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    DatePipe,
    NutriButtonComponent,
    NutriInputComponent,
    NutriAvatarComponent,
    NutriSectionComponent,
    NutriStatCardComponent,
  ],
  template: `
    <div class="portal-page">
      @if (dossier(); as d) {
        <div class="profile-hero portal-card">
          <div class="profile-hero__main">
            <nutri-avatar
              [name]="d.patientName"
              [photoUrl]="d.patientPhotoThumbnailUrl"
              size="lg"
            />
            <div>
              <h1 class="profile-hero__name">{{ d.patientName }}</h1>
              <p class="profile-hero__meta">{{ d.patientEmail }}</p>
              @if (d.cpfMasked) {
                <p class="profile-hero__meta">CPF: {{ d.cpfMasked }}</p>
              }
              @if (d.patientBirthDate) {
                <p class="profile-hero__meta">Nascimento: {{ d.patientBirthDate | date:'dd/MM/yyyy' }}</p>
              }
              <p class="profile-hero__meta">Status: {{ d.care.status }}</p>
            </div>
          </div>
        </div>

        @if (d.profile; as p) {
          <nutri-section title="Perfil nutricional">
            <div class="macro-grid">
              <nutri-stat-card [value]="(p.targetCalories | number:'1.0-0') + ' kcal'" label="Meta" />
              <nutri-stat-card [value]="(p.targetProteinG | number:'1.0-0') + 'g'" label="Proteína" />
              <nutri-stat-card [value]="(p.targetCarbsG | number:'1.0-0') + 'g'" label="Carbos" />
              <nutri-stat-card [value]="(p.targetFatG | number:'1.0-0') + 'g'" label="Gorduras" />
            </div>
            <div class="portal-card">
              <p><strong>Objetivo:</strong> {{ p.goal }}</p>
              <p><strong>Dieta:</strong> {{ p.dietaryPreference }}</p>
              @if (p.healthConditions) {
                <p><strong>Condições:</strong> {{ p.healthConditions }}</p>
              }
              @if (p.allergies) {
                <p><strong>Alergias:</strong> {{ p.allergies }}</p>
              }
            </div>
          </nutri-section>

          <nutri-section title="Ajustar dieta" description="Alterações entram no próximo plano gerado.">
            <div class="portal-card">
              <form class="form-grid form-grid--full" (ngSubmit)="saveNutrition()">
                <div>
                  <label class="field-label">Objetivo</label>
                  <select class="nutri-select" [(ngModel)]="editGoal" name="goal">
                    @for (o of goalOptions; track o.value) {
                      <option [value]="o.value">{{ o.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="field-label">Dieta</label>
                  <select class="nutri-select" [(ngModel)]="editDiet" name="diet">
                    @for (o of dietOptions; track o.value) {
                      <option [value]="o.value">{{ o.label }}</option>
                    }
                  </select>
                </div>
                <nutri-input label="Notas de refeição" type="textarea" [(ngModel)]="editMealNotes" name="mealNotes" />
                <nutri-input label="Notas de saúde" type="textarea" [(ngModel)]="editHealthNotes" name="healthNotes" />
                <nutri-input
                  label="Orientações para o plano (enviadas à IA)"
                  type="textarea"
                  [(ngModel)]="nutritionistPlanNotes"
                  name="nutritionistPlanNotes"
                />
                <div class="portal-actions" style="margin-top: 0; padding-top: 0; border: none">
                  <nutri-button variant="primary" type="submit" [disabled]="savingNutrition">
                    {{ savingNutrition ? 'Salvando...' : 'Salvar ajustes' }}
                  </nutri-button>
                  <nutri-button variant="secondary" [disabled]="generatingPlan" (click)="generatePlan()">
                    {{ generatingPlan ? 'Gerando...' : 'Regenerar com IA' }}
                  </nutri-button>
                </div>
              </form>
            </div>
          </nutri-section>
        }

        @if (d.checkinStats) {
          <nutri-section title="Adesão">
            <div class="macro-grid">
              <nutri-stat-card [value]="d.checkinStats.currentStreak" label="Sequência (dias)" />
              <nutri-stat-card [value]="d.checkinStats.weekAdherencePercent + '%'" label="Adesão semanal" />
            </div>
          </nutri-section>
        }

        @if (d.latestProgressReview) {
          <nutri-section title="Última revisão de progresso">
            <div class="portal-card">
              <p><strong>Tendência:</strong> {{ trendLabel(d.latestProgressReview.trend) }}</p>
              @if (d.latestProgressReview.summary) {
                <p>{{ d.latestProgressReview.summary }}</p>
              }
              @if (d.latestProgressReview.recommendations.length) {
                <ul>
                  @for (rec of d.latestProgressReview.recommendations; track rec) {
                    <li>{{ rec }}</li>
                  }
                </ul>
              }
            </div>
          </nutri-section>
        }

        @if (d.evolution?.metrics?.length) {
          <nutri-section title="Evolução">
            <div class="macro-grid">
              @for (m of d.evolution!.metrics.slice(0, 4); track m.label) {
                <nutri-stat-card [value]="m.current ?? '—'" [label]="m.label" />
              }
            </div>
          </nutri-section>
        }

        <nutri-section title="Registrar medição">
          <div class="portal-card">
            <form class="form-grid" (ngSubmit)="saveMeasurement()">
              <nutri-input label="Data" type="date" [(ngModel)]="measurementDate" name="date" />
              <nutri-input label="Peso (kg)" type="number" [(ngModel)]="measurementWeight" name="weight" />
              <nutri-input label="% gordura" type="number" [(ngModel)]="measurementBodyFat" name="fat" />
              <nutri-input label="Cintura (cm)" type="number" [(ngModel)]="measurementWaist" name="waist" />
              <nutri-input label="Observações" type="textarea" [(ngModel)]="measurementNotes" name="notes" />
              <div class="form-grid--full portal-actions" style="margin-top: 0; padding-top: 0; border: none">
                <nutri-button variant="primary" type="submit" [disabled]="savingMeasurement">
                  {{ savingMeasurement ? 'Salvando...' : 'Registrar medição' }}
                </nutri-button>
              </div>
            </form>
          </div>
        </nutri-section>

        @if (plans().length) {
          <nutri-section title="Planos alimentares">
            <div class="portal-list">
              @for (plan of plans(); track plan.id) {
                <div class="portal-list-item">
                  <div class="portal-list-item__main">
                    <strong>Plano #{{ plan.id }}</strong>
                    <span>{{ plan.totalCalories | number:'1.0-0' }} kcal · {{ plan.meals.length }} refeições</span>
                  </div>
                  <nutri-button variant="secondary" size="sm" [disabled]="publishingId === plan.id" (click)="publish(plan.id)">
                    {{ publishingId === plan.id ? 'Publicando...' : 'Publicar revisão' }}
                  </nutri-button>
                </div>
              }
            </div>
          </nutri-section>
        }

        @if (d.measurements.length) {
          <nutri-section title="Medições recentes">
            <div class="portal-list">
              @for (m of d.measurements; track m.id) {
                <div class="portal-list-item">
                  <div class="portal-list-item__main">
                    <strong>{{ m.measuredOn }}</strong>
                    <span>{{ m.weightKg }} kg @if (m.bodyFatPercent) { · {{ m.bodyFatPercent }}% gordura }</span>
                  </div>
                </div>
              }
            </div>
          </nutri-section>
        }
      }
    </div>
  `,
  styleUrl: '../../portal/portal.scss',
})
export class ProDossierComponent implements OnInit {
  private readonly proRepo = inject(PRO_REPOSITORY);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(NutriToastService);
  private readonly analytics = inject(AnalyticsService);

  readonly goalOptions = GOAL_OPTIONS;
  readonly dietOptions = DIET_OPTIONS;
  readonly dossier = signal<PatientDossier | null>(null);
  readonly plans = signal<MealPlan[]>([]);

  editGoal = 'LOSE_WEIGHT';
  editDiet = 'OMNIVORE';
  editMealNotes = '';
  editHealthNotes = '';
  nutritionistPlanNotes = '';
  measurementDate = new Date().toISOString().slice(0, 10);
  measurementWeight = 0;
  measurementBodyFat: number | null = null;
  measurementWaist: number | null = null;
  measurementNotes = '';

  publishingId: number | null = null;
  savingNutrition = false;
  savingMeasurement = false;
  generatingPlan = false;

  async ngOnInit(): Promise<void> {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));
    const [dossier, plans] = await Promise.all([
      this.proRepo.getDossier(patientId),
      this.proRepo.listPatientMealPlans(patientId),
    ]);
    this.dossier.set(dossier);
    this.plans.set(plans);
    if (dossier.profile) {
      this.editGoal = dossier.profile.goal;
      this.editDiet = dossier.profile.dietaryPreference;
      this.editMealNotes = dossier.profile.mealNotes ?? '';
      this.editHealthNotes = dossier.profile.healthNotes ?? '';
      this.measurementWeight = dossier.profile.currentWeightKg;
    }
  }

  trendLabel(trend?: string): string {
    if (!trend) return '—';
    return TREND_LABELS[trend] ?? trend;
  }

  async saveNutrition(): Promise<void> {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.savingNutrition = true;
    await withActionFeedback(
      this.toast,
      async () => {
        const profile = await this.proRepo.updatePatientNutrition(patientId, {
          goal: this.editGoal,
          dietaryPreference: this.editDiet,
          mealNotes: this.editMealNotes.trim() || undefined,
          healthNotes: this.editHealthNotes.trim() || undefined,
        });
        this.dossier.update((d) => (d ? { ...d, profile } : d));
      },
      { success: 'Perfil nutricional atualizado' },
    );
    this.savingNutrition = false;
  }

  async generatePlan(): Promise<void> {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.generatingPlan = true;
    await withActionFeedback(
      this.toast,
      async () => {
        await this.proRepo.generatePatientMealPlan(
          patientId,
          this.nutritionistPlanNotes.trim() || undefined,
        );
        this.plans.set(await this.proRepo.listPatientMealPlans(patientId));
        this.analytics.trackProPlanGenerated();
      },
      { success: 'Geração de plano iniciada' },
    );
    this.generatingPlan = false;
  }

  async saveMeasurement(): Promise<void> {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.savingMeasurement = true;
    await withActionFeedback(
      this.toast,
      async () => {
        const measurement = await this.proRepo.recordMeasurement(patientId, {
          measuredOn: this.measurementDate,
          weightKg: this.measurementWeight,
          bodyFatPercent: this.measurementBodyFat ?? undefined,
          waistCm: this.measurementWaist ?? undefined,
          notes: this.measurementNotes.trim() || undefined,
        });
        this.dossier.update((d) =>
          d ? { ...d, measurements: [measurement, ...d.measurements] } : d,
        );
      },
      { success: 'Medição registrada' },
    );
    this.savingMeasurement = false;
  }

  async publish(mealPlanId: number): Promise<void> {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.publishingId = mealPlanId;
    await withActionFeedback(
      this.toast,
      async () => {
        await this.proRepo.publishMealPlan(
          patientId,
          mealPlanId,
          this.nutritionistPlanNotes.trim() || undefined,
          this.nutritionistPlanNotes.trim() || undefined,
        );
      },
      { success: 'Plano publicado' },
    );
    this.publishingId = null;
  }
}

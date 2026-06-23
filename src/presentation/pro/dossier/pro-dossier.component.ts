import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { PRO_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { MealPlan, PatientDossier } from '../../../domain/entities';

@Component({
  selector: 'app-pro-dossier',
  standalone: true,
  imports: [DecimalPipe, NutriButtonComponent],
  template: `
    <div class="portal-page">
      @if (dossier()) {
        <div class="portal-main__header">
          <h1>{{ dossier()!.patientName }}</h1>
          <p>Dossiê clínico · {{ dossier()!.care.status }}</p>
        </div>
        @if (dossier()!.profile) {
          <section class="portal-section">
            <h2 class="portal-section__title">Perfil nutricional</h2>
            <div class="portal-card">
              <p><strong>Meta:</strong> {{ dossier()!.profile!.targetCalories | number:'1.0-0' }} kcal/dia</p>
              <p><strong>Objetivo:</strong> {{ dossier()!.profile!.goal }}</p>
              <p><strong>Dieta:</strong> {{ dossier()!.profile!.dietaryPreference }}</p>
              @if (dossier()!.profile!.athleteModeEnabled) {
                <p><strong>Modo atleta:</strong> +{{ dossier()!.profile!.trainingDailyExtraKcal | number:'1.0-0' }} kcal/dia de treino</p>
              }
            </div>
          </section>
        }
        @if (plans().length) {
          <section class="portal-section">
            <h2 class="portal-section__title">Planos alimentares</h2>
            <div class="portal-list">
              @for (plan of plans(); track plan.id) {
                <div class="portal-list-item">
                  <div class="portal-list-item__main">
                    <strong>Plano #{{ plan.id }}</strong>
                    <span>{{ plan.totalCalories | number:'1.0-0' }} kcal · {{ plan.meals.length }} refeições</span>
                  </div>
                  <nutri-button variant="secondary" size="sm" [disabled]="publishingId === plan.id" (click)="publish(plan.id)">
                    {{ publishingId === plan.id ? 'Publicando...' : 'Publicar' }}
                  </nutri-button>
                </div>
              }
            </div>
          </section>
        }
        @if (dossier()!.measurements.length) {
          <section class="portal-section">
            <h2 class="portal-section__title">Medições recentes</h2>
            <div class="portal-list">
              @for (m of dossier()!.measurements; track m.id) {
                <div class="portal-list-item">
                  <div class="portal-list-item__main">
                    <strong>{{ m.measuredOn }}</strong>
                    <span>{{ m.weightKg }} kg</span>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
  styleUrl: '../../portal/portal.scss',
})
export class ProDossierComponent implements OnInit {
  private readonly proRepo = inject(PRO_REPOSITORY);
  private readonly route = inject(ActivatedRoute);
  readonly dossier = signal<PatientDossier | null>(null);
  readonly plans = signal<MealPlan[]>([]);
  publishingId: number | null = null;

  async ngOnInit(): Promise<void> {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.dossier.set(await this.proRepo.getDossier(patientId));
    this.plans.set(await this.proRepo.listPatientMealPlans(patientId));
  }

  async publish(mealPlanId: number): Promise<void> {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.publishingId = mealPlanId;
    try {
      await this.proRepo.publishMealPlan(patientId, mealPlanId);
    } finally {
      this.publishingId = null;
    }
  }
}

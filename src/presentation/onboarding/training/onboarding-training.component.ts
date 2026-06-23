import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriInputComponent } from '../../../design-system/nutri-input/nutri-input.component';
import { NutriInfoTipComponent } from '../../../design-system/nutri-info-tip/nutri-info-tip.component';
import { OnboardingDraftService } from '../onboarding-draft.service';
import { NUTRITION_REPOSITORY } from '../../../domain/repositories/nutrition.repository';
import { OnboardingActivityDraft, SportCatalogItem } from '../../../domain/entities';

@Component({
  selector: 'app-onboarding-training',
  standalone: true,
  imports: [FormsModule, RouterLink, NutriButtonComponent, NutriInputComponent, NutriInfoTipComponent],
  template: `
    <div class="onboarding">
      <div class="onboarding__card onboarding__card--wide">
        <p class="onboarding__step">Passo 3 de 8</p>
        <h1>Seus treinos</h1>
        <p class="onboarding__lead">Cadastre pelo menos uma atividade para ajustar calorias no plano.</p>
        <nutri-info-tip
          message="Usamos dias por semana e duração para estimar o gasto extra. Você poderá editar depois em Treino."
        />
        @if (error) {
          <div class="auth-card__error">{{ error }}</div>
        }
        <div class="form-grid">
          <div class="form-grid--full">
            <label class="field-label" for="sport">Esporte</label>
            <select id="sport" class="nutri-select" [(ngModel)]="selectedSport" name="sport">
              @for (s of sports(); track s.sportType) {
                <option [value]="s.sportType">{{ s.label }}</option>
              }
            </select>
          </div>
          <nutri-input label="Dias por semana" type="number" [(ngModel)]="daysPerWeekStr" name="days" />
          <nutri-input label="Minutos por sessão" type="number" [(ngModel)]="minutesPerSessionStr" name="minutes" />
        </div>
        <div class="onboarding__actions onboarding__actions--inline">
          <nutri-button variant="secondary" (click)="addActivity()">Adicionar atividade</nutri-button>
        </div>
        @if (activities.length) {
          <div class="onboarding-activity-list">
            @for (a of activities; track a.sportType) {
              <div class="onboarding-activity-item">
                <div>
                  <strong>{{ a.label }}</strong>
                  <span>{{ a.daysPerWeek }}x/semana · {{ a.minutesPerSession }} min</span>
                </div>
                <nutri-button variant="ghost" size="sm" (click)="removeActivity(a.sportType)">Remover</nutri-button>
              </div>
            }
          </div>
        }
        <div class="onboarding__actions">
          <nutri-button variant="ghost" routerLink="/onboarding/tipo">Voltar</nutri-button>
          <nutri-button variant="primary" (click)="continue()">Continuar</nutri-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../onboarding.scss',
})
export class OnboardingTrainingComponent implements OnInit {
  private readonly draft = inject(OnboardingDraftService);
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly router = inject(Router);

  readonly sports = signal<SportCatalogItem[]>([]);
  selectedSport = '';
  daysPerWeekStr = '3';
  minutesPerSessionStr = '60';
  activities: OnboardingActivityDraft[] = [...this.draft.draft().activities];
  error: string | null = null;

  async ngOnInit(): Promise<void> {
    try {
      this.sports.set(await this.nutritionRepo.getSportCatalog());
      if (this.sports().length) this.selectedSport = this.sports()[0].sportType;
    } catch {
      this.sports.set([
        { sportType: 'RUNNING', label: 'Corrida', met: 9, intensityHint: 'Alta' },
        { sportType: 'WEIGHT_TRAINING', label: 'Musculação', met: 6, intensityHint: 'Moderada' },
      ]);
      this.selectedSport = 'RUNNING';
    }
  }

  addActivity(): void {
    const sport = this.sports().find((s) => s.sportType === this.selectedSport);
    if (!sport || this.activities.some((a) => a.sportType === sport.sportType)) return;
    const days = Math.min(7, Math.max(1, Number(this.daysPerWeekStr) || 3));
    const minutes = Math.max(15, Number(this.minutesPerSessionStr) || 60);
    this.activities.push({
      sportType: sport.sportType,
      label: sport.label,
      daysPerWeek: days,
      minutesPerSession: minutes,
    });
    this.error = null;
  }

  removeActivity(sportType: string): void {
    this.activities = this.activities.filter((a) => a.sportType !== sportType);
  }

  continue(): void {
    if (!this.activities.length) {
      this.error = 'Adicione pelo menos um treino para continuar.';
      return;
    }
    this.draft.update({ activities: [...this.activities], athleteModeEnabled: true });
    this.router.navigate(['/onboarding/preferencias']);
  }
}

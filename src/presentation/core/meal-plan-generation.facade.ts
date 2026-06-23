import { Injectable, inject, signal } from '@angular/core';
import { NUTRITION_REPOSITORY } from '../../domain/repositories/nutrition.repository';
import { MealPlanGenerationStatus } from '../../domain/entities';
import { NutriToastService } from '../../design-system/nutri-toast/nutri-toast.service';
import { parseApiError } from '../../infrastructure/http/api-error';

export type GenerationPhase = 'idle' | 'generating' | 'ready' | 'failed';

@Injectable({ providedIn: 'root' })
export class MealPlanGenerationFacade {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly toast = inject(NutriToastService);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly phase = signal<GenerationPhase>('idle');
  readonly status = signal<MealPlanGenerationStatus | null>(null);
  readonly error = signal<string | null>(null);

  async bootstrap(): Promise<void> {
    try {
      const s = await this.nutritionRepo.getMealPlanGenerationStatus();
      if (s.status === 'PENDING' || s.status === 'RUNNING') {
        this.phase.set('generating');
        this.status.set(s);
        this.startPolling();
      }
    } catch {
      // no active job
    }
  }

  async generate(): Promise<void> {
    this.error.set(null);
    this.phase.set('generating');
    try {
      const s = await this.nutritionRepo.requestMealPlanGeneration();
      this.status.set(s);
      this.startPolling();
    } catch (e) {
      const message = parseApiError(e).message;
      this.phase.set('failed');
      this.error.set(message);
      this.toast.error(message);
    }
  }

  acknowledgeReady(): void {
    if (this.phase() === 'ready') {
      this.phase.set('idle');
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => void this.poll(), 3000);
    void this.poll();
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const s = await this.nutritionRepo.getMealPlanGenerationStatus();
      this.status.set(s);
      if (s.status === 'COMPLETED') {
        this.phase.set('ready');
        this.stopPolling();
        this.toast.success('Seu plano alimentar está pronto!');
        setTimeout(() => this.acknowledgeReady(), 150);
      } else if (s.status === 'FAILED') {
        const message = s.errorMessage ?? 'Falha na geração do plano';
        this.phase.set('failed');
        this.error.set(message);
        this.stopPolling();
        this.toast.error(message);
      }
    } catch (e) {
      const message = parseApiError(e).message;
      this.phase.set('failed');
      this.error.set(message);
      this.stopPolling();
      this.toast.error(message);
    }
  }
}

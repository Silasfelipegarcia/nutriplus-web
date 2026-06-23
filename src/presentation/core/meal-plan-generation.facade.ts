import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { NUTRITION_REPOSITORY } from '../../domain/repositories/nutrition.repository';
import { MealPlanGenerationStatus } from '../../domain/entities';
import { NutriToastService } from '../../design-system/nutri-toast/nutri-toast.service';
import { parseApiError } from '../../infrastructure/http/api-error';
import { PortalDataStore } from './portal-data.store';

export type GenerationPhase = 'idle' | 'generating' | 'ready' | 'failed';

@Injectable({ providedIn: 'root' })
export class MealPlanGenerationFacade {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
  private readonly toast = inject(NutriToastService);
  private readonly portalData = inject(PortalDataStore);
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private pollAttempt = 0;
  private destroyRef: DestroyRef | null = null;

  readonly phase = signal<GenerationPhase>('idle');
  readonly status = signal<MealPlanGenerationStatus | null>(null);
  readonly error = signal<string | null>(null);

  async bootstrap(destroyRef?: DestroyRef): Promise<void> {
    if (destroyRef) {
      this.destroyRef = destroyRef;
      destroyRef.onDestroy(() => this.stopPolling());
    }
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

  stopPolling(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.pollAttempt = 0;
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollAttempt = 0;
    void this.poll();
  }

  private scheduleNextPoll(): void {
    const delays = [3000, 5000, 8000, 10000];
    const delay = delays[Math.min(this.pollAttempt, delays.length - 1)];
    this.pollAttempt += 1;
    this.pollTimer = setTimeout(() => void this.poll(), delay);
  }

  private async poll(): Promise<void> {
    if (this.destroyRef && this.phase() !== 'generating') {
      return;
    }
    try {
      const s = await this.nutritionRepo.getMealPlanGenerationStatus();
      this.status.set(s);
      if (s.status === 'COMPLETED') {
        this.phase.set('ready');
        this.stopPolling();
        this.portalData.invalidateMealData();
        this.toast.success('Seu plano alimentar está pronto!');
        setTimeout(() => this.acknowledgeReady(), 150);
        return;
      }
      if (s.status === 'FAILED') {
        const message = s.errorMessage ?? 'Falha na geração do plano';
        this.phase.set('failed');
        this.error.set(message);
        this.stopPolling();
        this.toast.error(message);
        return;
      }
      if (s.status === 'PENDING' || s.status === 'RUNNING') {
        this.scheduleNextPoll();
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

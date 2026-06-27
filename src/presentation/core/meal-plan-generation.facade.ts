import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { NUTRITION_REPOSITORY } from '../../domain/repositories/nutrition.repository';
import { MealPlanGenerationStatus } from '../../domain/entities';
import { NutriToastService } from '../../design-system/nutri-toast/nutri-toast.service';
import { parseApiError } from '../../infrastructure/http/api-error';
import { PortalDataStore } from './portal-data.store';
import {
  setAcknowledgedPlanReadyId,
  shouldNotifyPlanReady,
} from './plan-ready-storage';

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
  readonly showReadyNotice = signal(false);

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
      } else if (s.status === 'COMPLETED' && shouldNotifyPlanReady(s.mealPlanId)) {
        this.status.set(s);
        this.showReadyNotice.set(true);
      }
    } catch {
      // no active job
    }
  }

  async generate(): Promise<void> {
    this.error.set(null);
    this.phase.set('generating');
    this.showReadyNotice.set(false);
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

  acknowledgeReady(mealPlanId?: number | null): void {
    const id = mealPlanId ?? this.status()?.mealPlanId;
    if (id != null) {
      setAcknowledgedPlanReadyId(id);
    }
    this.showReadyNotice.set(false);
    if (this.phase() === 'ready') {
      this.phase.set('idle');
    }
  }

  dismissReadyNotice(): void {
    this.acknowledgeReady();
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
        this.stopPolling();
        this.portalData.invalidateMealData();
        if (shouldNotifyPlanReady(s.mealPlanId)) {
          this.phase.set('ready');
          this.showReadyNotice.set(true);
          this.toast.success('Seu plano alimentar está pronto!');
        } else {
          this.phase.set('idle');
          this.showReadyNotice.set(false);
        }
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

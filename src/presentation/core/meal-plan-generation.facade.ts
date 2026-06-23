import { Injectable, inject, signal } from '@angular/core';
import { NUTRITION_REPOSITORY } from '../../domain/repositories/nutrition.repository';
import { MealPlanGenerationStatus } from '../../domain/entities';

export type GenerationPhase = 'idle' | 'generating' | 'ready' | 'failed';

@Injectable({ providedIn: 'root' })
export class MealPlanGenerationFacade {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);
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
      this.phase.set('failed');
      this.error.set(e instanceof Error ? e.message : 'Erro ao gerar plano');
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
      } else if (s.status === 'FAILED') {
        this.phase.set('failed');
        this.error.set(s.errorMessage ?? 'Falha na geração do plano');
        this.stopPolling();
      }
    } catch (e) {
      this.phase.set('failed');
      this.error.set(e instanceof Error ? e.message : 'Erro ao verificar status');
      this.stopPolling();
    }
  }
}

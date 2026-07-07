import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HOUSEHOLD_REPOSITORY } from '../../domain/repositories/household.repository';
import { HouseholdInviteStorage } from './household-invite-storage';
import { MealPlanGenerationFacade } from './meal-plan-generation.facade';
import { NutriToastService } from '../../design-system/nutri-toast/nutri-toast.service';

@Injectable({ providedIn: 'root' })
export class HouseholdInviteFlowService {
  private readonly householdRepo = inject(HOUSEHOLD_REPOSITORY);
  private readonly generation = inject(MealPlanGenerationFacade);
  private readonly toast = inject(NutriToastService);
  private readonly router = inject(Router);

  async tryAcceptPendingInvite(): Promise<boolean> {
    const token = HouseholdInviteStorage.readPendingToken();
    if (!token) return false;

    try {
      const result = await this.householdRepo.acceptInvitation(token);
      HouseholdInviteStorage.clearPendingToken();
      if (result.planGenerationStarted) {
        await this.generation.bootstrap();
      }
      this.toast.success(result.message || 'Você entrou no plano da família.');
      await this.router.navigate(['/app/plano']);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível aceitar o convite.';
      this.toast.error(message);
      return false;
    }
  }
}

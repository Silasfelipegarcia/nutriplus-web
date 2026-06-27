const ACK_KEY = 'nutri_ack_plan_ready_id';

export function getAcknowledgedPlanReadyId(): number | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(ACK_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function setAcknowledgedPlanReadyId(mealPlanId: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ACK_KEY, String(mealPlanId));
}

export function shouldNotifyPlanReady(mealPlanId: number | undefined | null): boolean {
  if (mealPlanId == null) return false;
  return getAcknowledgedPlanReadyId() !== mealPlanId;
}

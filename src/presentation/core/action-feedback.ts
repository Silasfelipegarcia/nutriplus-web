import { NutriToastService } from '../../design-system/nutri-toast/nutri-toast.service';
import { parseApiError } from '../../infrastructure/http/api-error';

export async function withActionFeedback(
  toast: NutriToastService,
  action: () => Promise<void>,
  messages: { success: string; error?: string },
): Promise<boolean> {
  try {
    await action();
    toast.success(messages.success);
    return true;
  } catch (e) {
    const fallback = messages.error ?? 'Não foi possível concluir. Tente novamente.';
    toast.error(parseApiError(e).message || fallback);
    return false;
  }
}

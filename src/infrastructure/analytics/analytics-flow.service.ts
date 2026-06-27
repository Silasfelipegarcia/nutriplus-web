import { Injectable } from '@angular/core';

const FLOW_ID_KEY = 'nutri_analytics_flow_id';

@Injectable({ providedIn: 'root' })
export class AnalyticsFlowService {
  private flowId: string | null = null;

  getFlowId(): string {
    if (this.flowId) {
      return this.flowId;
    }

    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(FLOW_ID_KEY);
      if (stored) {
        this.flowId = stored;
        return stored;
      }
    }

    const id = crypto.randomUUID();
    this.flowId = id;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(FLOW_ID_KEY, id);
    }
    return id;
  }
}

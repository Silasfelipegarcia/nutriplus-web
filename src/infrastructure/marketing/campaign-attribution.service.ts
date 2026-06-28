import { Injectable } from '@angular/core';

export interface CampaignAttribution {
  acquisitionSource?: string;
  acquisitionMedium?: string;
  acquisitionCampaign?: string;
  acquisitionLanding?: string;
}

const STORAGE_KEY = 'nutri_campaign_attribution';
const CAMPAIGN_VIEW_KEY = 'nutri_campaign_view_tracked';

@Injectable({ providedIn: 'root' })
export class CampaignAttributionService {
  captureFromRouterUrl(routerUrl: string): void {
    const [pathPart, queryPart] = routerUrl.split('?');
    const path = pathPart.split('#')[0] || '/';
    const search = queryPart ? `?${queryPart.split('#')[0]}` : '';
    this.captureFromUrl(search, path);
  }

  captureFromUrl(search: string, landingPath: string): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const source = params.get('utm_source')?.trim();
    const medium = params.get('utm_medium')?.trim();
    const campaign = params.get('utm_campaign')?.trim();
    const current = this.read();
    if (!source && !medium && !campaign) {
      if (landingPath === '/beta' && !current?.acquisitionLanding) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ acquisitionLanding: landingPath }));
      }
      return;
    }
    const next: CampaignAttribution = {
      acquisitionSource: source ?? current?.acquisitionSource,
      acquisitionMedium: medium ?? current?.acquisitionMedium,
      acquisitionCampaign: campaign ?? current?.acquisitionCampaign,
      acquisitionLanding: landingPath,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  read(): CampaignAttribution | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as CampaignAttribution;
    } catch {
      return null;
    }
  }

  payload(): CampaignAttribution {
    return this.read() ?? {};
  }

  wasCampaignLandingTracked(path: string): boolean {
    if (typeof sessionStorage === 'undefined') {
      return false;
    }
    return sessionStorage.getItem(`${CAMPAIGN_VIEW_KEY}:${path}`) === '1';
  }

  markCampaignLandingTracked(path: string): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.setItem(`${CAMPAIGN_VIEW_KEY}:${path}`, '1');
  }
}

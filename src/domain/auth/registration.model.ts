import { CampaignAttribution } from '../../infrastructure/marketing/campaign-attribution.service';

export interface PatientRegistrationData extends CampaignAttribution {
  name: string;
  email: string;
  password: string;
  cpf: string;
  birthDate: string;
  contactPhone: string;
}

export type BetaProfileType = 'patient' | 'nutritionist';

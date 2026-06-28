import { InjectionToken } from '@angular/core';
import { AuthResponse, RegisterResponse, User } from '../entities';
import { PatientRegistrationData } from '../auth/registration.model';

export interface NutritionistRegisterData {
  name: string;
  email: string;
  password: string;
  cpf: string;
  contactPhone: string;
  crn: string;
  bio?: string;
  specialties?: string;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthResponse>;
  register(name: string, email: string, password: string, cpf: string, birthDate: string, contactPhone: string): Promise<RegisterResponse>;
  registerPatient(data: PatientRegistrationData): Promise<RegisterResponse>;
  betaRequest(name: string, email: string, password: string, cpf: string, birthDate: string, contactPhone: string): Promise<RegisterResponse>;
  betaRequestPatient(data: PatientRegistrationData): Promise<RegisterResponse>;
  registerNutritionist(data: NutritionistRegisterData): Promise<RegisterResponse>;
  betaRequestNutritionist(data: NutritionistRegisterData): Promise<RegisterResponse>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  getMe(): Promise<User>;
  acceptTerms(termsVersion: string, privacyVersion: string): Promise<User>;
  changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse>;
  updateProfile(data: { name?: string; photoUrl?: string }): Promise<User>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');

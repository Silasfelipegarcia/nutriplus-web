import { InjectionToken } from '@angular/core';
import { AuthResponse, RegisterResponse, User } from '../entities';

export interface NutritionistRegisterData {
  name: string;
  email: string;
  password: string;
  cpf: string;
  crn: string;
  bio?: string;
  specialties?: string;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthResponse>;
  register(name: string, email: string, password: string, cpf: string, birthDate: string): Promise<RegisterResponse>;
  betaRequest(name: string, email: string, password: string, cpf: string, birthDate: string): Promise<RegisterResponse>;
  registerNutritionist(data: NutritionistRegisterData): Promise<RegisterResponse>;
  betaRequestNutritionist(data: NutritionistRegisterData): Promise<RegisterResponse>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  getMe(): Promise<User>;
  acceptTerms(termsVersion: string, privacyVersion: string): Promise<User>;
  changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse>;
  updateProfile(data: { name?: string; photoUrl?: string }): Promise<User>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');

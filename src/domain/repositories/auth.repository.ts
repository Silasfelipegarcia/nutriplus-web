import { InjectionToken } from '@angular/core';
import { AuthResponse, User } from '../entities';

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
  register(name: string, email: string, password: string, cpf: string, birthDate: string): Promise<AuthResponse>;
  registerNutritionist(data: NutritionistRegisterData): Promise<AuthResponse>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  getMe(): Promise<User>;
  acceptTerms(termsVersion: string, privacyVersion: string): Promise<User>;
  changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse>;
  updateProfile(data: { name?: string; photoUrl?: string }): Promise<User>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');

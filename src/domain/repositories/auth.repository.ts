import { InjectionToken } from '@angular/core';
import { AuthResponse, User } from '../entities';

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthResponse>;
  register(name: string, email: string, password: string): Promise<AuthResponse>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  getMe(): Promise<User>;
  acceptTerms(termsVersion: string, privacyVersion: string): Promise<User>;
  changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse>;
  updateProfile(data: { name?: string; photoUrl?: string }): Promise<User>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');

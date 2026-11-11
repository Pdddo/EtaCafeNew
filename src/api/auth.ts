import { request } from './client';

export interface LoginPayload {
  username_or_email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email_or_phone: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email_or_phone: string;
    role: 'pelanggan' | 'kasir' | 'dapur' | 'manajer';
    created_at?: string;
  };
}

export async function login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
  });
}

export async function register(
  name: string,
  emailOrPhone: string,
  password: string,
  role = 'pelanggan'
): Promise<any> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email_or_phone: emailOrPhone, password, role }),
  });
}

export async function getCurrentUser(): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/me', {
    method: 'GET',
  });
}

export const AuthAPI = {
  login,
  register,
  getCurrentUser,
};

export default AuthAPI;

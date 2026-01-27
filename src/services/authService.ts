import api from './api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ChangeEmailRequest,
} from '../types';

const AUTH_BASE = '/v1/auth';

export const authService = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(`${AUTH_BASE}/login`, data);
    return response.data;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(`${AUTH_BASE}/register`, data);
    return response.data;
  },

  /**
   * Logout - invalidate refresh token
   */
  logout: async (refreshToken: string): Promise<void> => {
    await api.post(`${AUTH_BASE}/logout`, { refreshToken });
  },

  /**
   * Request password reset email
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`${AUTH_BASE}/forgot-password`, data);
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`${AUTH_BASE}/reset-password`, data);
    return response.data;
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`${AUTH_BASE}/change-password`, data);
    return response.data;
  },

  /**
   * Change email (authenticated)
   */
  changeEmail: async (data: ChangeEmailRequest): Promise<{ message: string; email: string }> => {
    const response = await api.post<{ message: string; email: string }>(
      `${AUTH_BASE}/change-email`,
      data
    );
    return response.data;
  },
};

export default authService;

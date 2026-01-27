import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import authService from '../services/authService';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ChangeEmailRequest,
} from '../types';

export function useAuth() {
  const { profile, isAuthenticated, isLoading, setAuth, clearAuth, setProfile } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: async (response) => {
      await setAuth(response.accessToken, response.refreshToken, response.profile);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: async (response) => {
      await setAuth(response.accessToken, response.refreshToken, response.profile);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch {
          // Ignore logout errors, clear local state anyway
        }
      }
      await clearAuth();
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authService.forgotPassword(data),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.resetPassword(data),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
  });

  const changeEmailMutation = useMutation({
    mutationFn: (data: ChangeEmailRequest) => authService.changeEmail(data),
    onSuccess: (response) => {
      // Update profile with new email
      if (profile) {
        setProfile({ ...profile, email: response.email });
      }
    },
  });

  return {
    profile,
    isAuthenticated,
    isLoading,

    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,

    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,

    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,

    forgotPassword: forgotPasswordMutation.mutateAsync,
    forgotPasswordError: forgotPasswordMutation.error,
    isSendingResetEmail: forgotPasswordMutation.isPending,
    resetEmailSent: forgotPasswordMutation.isSuccess,

    resetPassword: resetPasswordMutation.mutateAsync,
    resetPasswordError: resetPasswordMutation.error,
    isResettingPassword: resetPasswordMutation.isPending,

    changePassword: changePasswordMutation.mutateAsync,
    changePasswordError: changePasswordMutation.error,
    isChangingPassword: changePasswordMutation.isPending,

    changeEmail: changeEmailMutation.mutateAsync,
    changeEmailError: changeEmailMutation.error,
    isChangingEmail: changeEmailMutation.isPending,
  };
}

export default useAuth;

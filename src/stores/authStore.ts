import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { Profile } from '../types';

interface AuthState {
  profile: Profile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setAuth: (accessToken: string, refreshToken: string, profile: Profile) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setProfile: (profile: Profile) => void;
  clearAuth: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'fittrack_access_token';
const REFRESH_TOKEN_KEY = 'fittrack_refresh_token';
const PROFILE_KEY = 'fittrack_profile';

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (accessToken: string, refreshToken: string, profile: Profile) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
    set({
      accessToken,
      refreshToken,
      profile,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  setProfile: (profile: Profile) => {
    SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile)).catch(console.error);
    set({ profile });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(PROFILE_KEY);
    set({
      profile: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  loadStoredAuth: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const profileJson = await SecureStore.getItemAsync(PROFILE_KEY);

      if (accessToken && refreshToken) {
        let profile: Profile | null = null;
        if (profileJson) {
          try {
            profile = JSON.parse(profileJson);
          } catch {
            // Invalid profile JSON, ignore
          }
        }
        set({
          accessToken,
          refreshToken,
          profile,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      set({ isLoading: false });
    }
  },
}));

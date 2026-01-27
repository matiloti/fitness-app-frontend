import api from './api';
import type {
  Profile,
  Country,
  ActivityLevelOption,
  FitnessGoalOption,
  UpdateProfileRequest,
  UpdateMetricsRequest,
  UpdateActivityLevelRequest,
  UpdateFitnessGoalRequest,
  ProfileMetrics,
  ActivityLevelInfo,
  FitnessGoalInfo,
  ProfileCalculations,
} from '../types';

const PROFILE_BASE = '/v1/profile';

interface MetricsResponse extends ProfileMetrics {
  calculations: ProfileCalculations;
}

interface ActivityLevelResponse {
  activityLevel: ActivityLevelInfo;
  calculations: ProfileCalculations;
}

interface FitnessGoalResponse {
  fitnessGoal: FitnessGoalInfo;
  calculations: ProfileCalculations;
}

export const profileService = {
  /**
   * Get current user's profile
   */
  getProfile: async (): Promise<Profile> => {
    const response = await api.get<Profile>(PROFILE_BASE);
    return response.data;
  },

  /**
   * Update profile information
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<Profile> => {
    const response = await api.patch<Profile>(PROFILE_BASE, data);
    return response.data;
  },

  /**
   * Update profile metrics (date of birth, sex, height)
   */
  updateMetrics: async (data: UpdateMetricsRequest): Promise<MetricsResponse> => {
    const response = await api.put<MetricsResponse>(`${PROFILE_BASE}/metrics`, data);
    return response.data;
  },

  /**
   * Update activity level
   */
  updateActivityLevel: async (data: UpdateActivityLevelRequest): Promise<ActivityLevelResponse> => {
    const response = await api.put<ActivityLevelResponse>(`${PROFILE_BASE}/activity-level`, data);
    return response.data;
  },

  /**
   * Update fitness goal
   */
  updateFitnessGoal: async (data: UpdateFitnessGoalRequest): Promise<FitnessGoalResponse> => {
    const response = await api.put<FitnessGoalResponse>(`${PROFILE_BASE}/fitness-goal`, data);
    return response.data;
  },

  /**
   * Get list of countries
   */
  getCountries: async (search?: string): Promise<{ countries: Country[] }> => {
    const params = search ? { search } : {};
    const response = await api.get<{ countries: Country[] }>(`${PROFILE_BASE}/countries`, {
      params,
    });
    return response.data;
  },

  /**
   * Get activity level options
   */
  getActivityLevels: async (): Promise<{ activityLevels: ActivityLevelOption[] }> => {
    const response = await api.get<{ activityLevels: ActivityLevelOption[] }>(
      `${PROFILE_BASE}/activity-levels`
    );
    return response.data;
  },

  /**
   * Get fitness goal options
   */
  getFitnessGoals: async (): Promise<{ fitnessGoals: FitnessGoalOption[] }> => {
    const response = await api.get<{ fitnessGoals: FitnessGoalOption[] }>(
      `${PROFILE_BASE}/fitness-goals`
    );
    return response.data;
  },

  /**
   * Upload profile photo
   */
  uploadPhoto: async (photoUri: string): Promise<{ photoUrl: string }> => {
    // Create form data with proper React Native format
    const formData = new FormData();

    // Extract filename and determine MIME type
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const extension = match ? match[1].toLowerCase() : 'jpg';

    // Map common extensions to MIME types
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      heic: 'image/heic',
      heif: 'image/heif',
    };
    const type = mimeTypes[extension] || 'image/jpeg';

    // Append photo with proper React Native file format
    // React Native expects the file object in this specific format
    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type,
    } as any);

    try {
      const response = await api.post<{ photoUrl: string }>(`${PROFILE_BASE}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Increase timeout for photo uploads
        timeout: 30000,
      });
      return response.data;
    } catch (error: any) {
      console.error('Profile photo upload failed:', error);
      // Re-throw with more context
      const message = error?.response?.data?.message || error?.message || 'Failed to upload photo';
      throw new Error(message);
    }
  },

  /**
   * Delete profile photo
   */
  deletePhoto: async (): Promise<void> => {
    await api.delete(`${PROFILE_BASE}/photo`);
  },
};

export default profileService;

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import profileService from '../services/profileService';
import type {
  UpdateProfileRequest,
  UpdateMetricsRequest,
  UpdateActivityLevelRequest,
  UpdateFitnessGoalRequest,
} from '../types';

const PROFILE_KEY = ['profile'];
const ACTIVITY_LEVELS_KEY = ['activity-levels'];
const FITNESS_GOALS_KEY = ['fitness-goals'];
const COUNTRIES_KEY = ['countries'];

export function useProfile() {
  const queryClient = useQueryClient();
  const { setProfile, profile: storedProfile } = useAuthStore();

  // Query for fetching profile
  const profileQuery = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: profileService.getProfile,
    enabled: useAuthStore.getState().isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update local store when profile is fetched
  if (profileQuery.data && profileQuery.data !== storedProfile) {
    setProfile(profileQuery.data);
  }

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileService.updateProfile(data),
    onSuccess: async () => {
      // Refetch profile to get updated data
      const profile = await profileService.getProfile();
      setProfile(profile);
      queryClient.setQueryData(PROFILE_KEY, profile);
    },
  });

  // Mutation for updating metrics
  const updateMetricsMutation = useMutation({
    mutationFn: (data: UpdateMetricsRequest) => profileService.updateMetrics(data),
    onSuccess: async () => {
      const profile = await profileService.getProfile();
      setProfile(profile);
      queryClient.setQueryData(PROFILE_KEY, profile);
    },
  });

  // Mutation for updating activity level
  const updateActivityLevelMutation = useMutation({
    mutationFn: (data: UpdateActivityLevelRequest) => profileService.updateActivityLevel(data),
    onSuccess: async () => {
      const profile = await profileService.getProfile();
      setProfile(profile);
      queryClient.setQueryData(PROFILE_KEY, profile);
    },
  });

  // Mutation for updating fitness goal
  const updateFitnessGoalMutation = useMutation({
    mutationFn: (data: UpdateFitnessGoalRequest) => profileService.updateFitnessGoal(data),
    onSuccess: async () => {
      const profile = await profileService.getProfile();
      setProfile(profile);
      queryClient.setQueryData(PROFILE_KEY, profile);
    },
  });

  // Mutation for uploading photo
  const uploadPhotoMutation = useMutation({
    mutationFn: (photoUri: string) => profileService.uploadPhoto(photoUri),
    onSuccess: async () => {
      const profile = await profileService.getProfile();
      setProfile(profile);
      queryClient.setQueryData(PROFILE_KEY, profile);
    },
  });

  // Mutation for deleting photo
  const deletePhotoMutation = useMutation({
    mutationFn: () => profileService.deletePhoto(),
    onSuccess: async () => {
      const profile = await profileService.getProfile();
      setProfile(profile);
      queryClient.setQueryData(PROFILE_KEY, profile);
    },
  });

  return {
    profile: profileQuery.data || storedProfile,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch,

    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,

    updateMetrics: updateMetricsMutation.mutateAsync,
    isUpdatingMetrics: updateMetricsMutation.isPending,
    updateMetricsError: updateMetricsMutation.error,

    updateActivityLevel: updateActivityLevelMutation.mutateAsync,
    isUpdatingActivityLevel: updateActivityLevelMutation.isPending,
    updateActivityLevelError: updateActivityLevelMutation.error,

    updateFitnessGoal: updateFitnessGoalMutation.mutateAsync,
    isUpdatingFitnessGoal: updateFitnessGoalMutation.isPending,
    updateFitnessGoalError: updateFitnessGoalMutation.error,

    uploadPhoto: uploadPhotoMutation.mutateAsync,
    isUploadingPhoto: uploadPhotoMutation.isPending,
    uploadPhotoError: uploadPhotoMutation.error,

    deletePhoto: deletePhotoMutation.mutateAsync,
    isDeletingPhoto: deletePhotoMutation.isPending,
    deletePhotoError: deletePhotoMutation.error,
  };
}

// Hook for fetching activity level options
export function useActivityLevels() {
  return useQuery({
    queryKey: ACTIVITY_LEVELS_KEY,
    queryFn: profileService.getActivityLevels,
    staleTime: Infinity, // Static data
  });
}

// Hook for fetching fitness goal options
export function useFitnessGoals() {
  return useQuery({
    queryKey: FITNESS_GOALS_KEY,
    queryFn: profileService.getFitnessGoals,
    staleTime: Infinity, // Static data
  });
}

// Hook for fetching countries
export function useCountries(search?: string) {
  return useQuery({
    queryKey: [...COUNTRIES_KEY, search],
    queryFn: () => profileService.getCountries(search),
    staleTime: Infinity, // Static data
  });
}

export default useProfile;

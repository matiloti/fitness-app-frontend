import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import workoutService, {
  type WorkoutListParams,
  type CreateWorkoutRequest,
  type UpdateWorkoutRequest,
  type WorkoutListResponse,
  type WorkoutDetail,
  type WorkoutTypesResponse,
  type CalorieEstimateResponse,
  type WorkoutSummaryResponse,
  type WorkoutStreakResponse,
  type WorkoutStatsResponse,
  type WeeklyOverviewResponse,
} from '../services/workoutService';
import type { WorkoutType } from '../types';

// =============================================================================
// Query Keys
// =============================================================================

export const workoutKeys = {
  all: ['workouts'] as const,
  lists: () => [...workoutKeys.all, 'list'] as const,
  list: (params: WorkoutListParams) => [...workoutKeys.lists(), params] as const,
  details: () => [...workoutKeys.all, 'detail'] as const,
  detail: (id: string) => [...workoutKeys.details(), id] as const,
  types: () => [...workoutKeys.all, 'types'] as const,
  estimate: (workoutType: WorkoutType, durationMinutes: number) =>
    [...workoutKeys.all, 'estimate', workoutType, durationMinutes] as const,
  summary: (startDate?: string, endDate?: string) =>
    [...workoutKeys.all, 'summary', { startDate, endDate }] as const,
  streak: () => [...workoutKeys.all, 'streak'] as const,
  stats: () => [...workoutKeys.all, 'stats'] as const,
  weekly: () => [...workoutKeys.all, 'weekly'] as const,
};

// =============================================================================
// List & Detail Hooks
// =============================================================================

/**
 * Hook to list workouts with optional filters
 */
export function useWorkoutList(params: WorkoutListParams = {}) {
  return useQuery<WorkoutListResponse>({
    queryKey: workoutKeys.list(params),
    queryFn: () => workoutService.list(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get workout details by ID
 */
export function useWorkoutById(id: string | undefined) {
  return useQuery<WorkoutDetail>({
    queryKey: workoutKeys.detail(id!),
    queryFn: () => workoutService.getById(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get all workout types
 */
export function useWorkoutTypes() {
  return useQuery<WorkoutTypesResponse>({
    queryKey: workoutKeys.types(),
    queryFn: () => workoutService.getTypes(),
    staleTime: 5 * 60 * 1000, // 5 minutes - types rarely change
  });
}

/**
 * Hook to estimate calories for a workout
 */
export function useCalorieEstimate(
  workoutType: WorkoutType | undefined,
  durationMinutes: number | undefined
) {
  return useQuery<CalorieEstimateResponse>({
    queryKey: workoutKeys.estimate(workoutType!, durationMinutes!),
    queryFn: () => workoutService.estimateCalories(workoutType!, durationMinutes!),
    enabled: !!workoutType && !!durationMinutes && durationMinutes > 0,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get workout summary/analytics
 */
export function useWorkoutSummary(startDate?: string, endDate?: string) {
  return useQuery<WorkoutSummaryResponse>({
    queryKey: workoutKeys.summary(startDate, endDate),
    queryFn: () => workoutService.getSummary(startDate, endDate),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get workout streak data
 */
export function useWorkoutStreak() {
  return useQuery<WorkoutStreakResponse>({
    queryKey: workoutKeys.streak(),
    queryFn: () => workoutService.getStreak(),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get workout statistics
 */
export function useWorkoutStats() {
  return useQuery<WorkoutStatsResponse>({
    queryKey: workoutKeys.stats(),
    queryFn: () => workoutService.getStats(),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get weekly overview
 */
export function useWeeklyOverview() {
  return useQuery<WeeklyOverviewResponse>({
    queryKey: workoutKeys.weekly(),
    queryFn: () => workoutService.getWeeklyOverview(),
    staleTime: 60 * 1000,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to create a new workout
 */
export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation<WorkoutDetail, Error, CreateWorkoutRequest>({
    mutationFn: (data) => workoutService.create(data),
    onSuccess: () => {
      // Invalidate all workout lists and dashboard data
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.streak() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.stats() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.weekly() });
      // Invalidate summary
      queryClient.invalidateQueries({ queryKey: workoutKeys.all, predicate: (query) =>
        query.queryKey[1] === 'summary'
      });
    },
  });
}

/**
 * Hook to update a workout
 */
export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation<
    WorkoutDetail,
    Error,
    { id: string; data: UpdateWorkoutRequest }
  >({
    mutationFn: ({ id, data }) => workoutService.update(id, data),
    onSuccess: (result) => {
      // Update the detail cache
      queryClient.setQueryData(workoutKeys.detail(result.id), result);
      // Invalidate lists and dashboard data
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.streak() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.stats() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.weekly() });
      // Invalidate summary
      queryClient.invalidateQueries({ queryKey: workoutKeys.all, predicate: (query) =>
        query.queryKey[1] === 'summary'
      });
    },
  });
}

/**
 * Hook to delete a workout
 */
export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => workoutService.delete(id),
    onSuccess: () => {
      // Invalidate all workout queries
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

export default {
  useWorkoutList,
  useWorkoutById,
  useWorkoutTypes,
  useCalorieEstimate,
  useWorkoutSummary,
  useWorkoutStreak,
  useWorkoutStats,
  useWeeklyOverview,
  useCreateWorkout,
  useUpdateWorkout,
  useDeleteWorkout,
};

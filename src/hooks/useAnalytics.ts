import { useQuery } from '@tanstack/react-query';
import analyticsService from '../services/analyticsService';
import type {
  Period,
  WeightTrendResponse,
  BodyCompositionTrendResponse,
  CalorieIntakeTrendResponse,
  MacroDistributionResponse,
  DashboardSummaryResponse,
  WorkoutSummaryResponse,
} from '../types/analytics';

// =============================================================================
// Query Keys
// =============================================================================

export const analyticsKeys = {
  all: ['analytics'] as const,
  weight: (period: Period) => [...analyticsKeys.all, 'weight', period] as const,
  bodyComposition: (period: Period, metrics?: string) =>
    [...analyticsKeys.all, 'bodyComposition', period, metrics] as const,
  calories: (period: Period) => [...analyticsKeys.all, 'calories', period] as const,
  macros: (date?: string, startDate?: string, endDate?: string) =>
    [...analyticsKeys.all, 'macros', { date, startDate, endDate }] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
  workouts: (period: Period) => [...analyticsKeys.all, 'workouts', period] as const,
};

// =============================================================================
// Analytics Hooks
// =============================================================================

/**
 * Hook to get weight trend data for charting
 */
export function useWeightTrend(period: Period = '30d') {
  return useQuery<WeightTrendResponse>({
    queryKey: analyticsKeys.weight(period),
    queryFn: () => analyticsService.getWeightTrend(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get body composition trend data
 */
export function useBodyCompositionTrend(
  period: Period = '30d',
  metrics?: string
) {
  return useQuery<BodyCompositionTrendResponse>({
    queryKey: analyticsKeys.bodyComposition(period, metrics),
    queryFn: () => analyticsService.getBodyCompositionTrend(period, metrics),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get calorie intake trend data
 */
export function useCalorieIntakeTrend(period: Period = '30d') {
  return useQuery<CalorieIntakeTrendResponse>({
    queryKey: analyticsKeys.calories(period),
    queryFn: () => analyticsService.getCalorieIntakeTrend(period),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get macro distribution for a single day
 */
export function useMacroDistribution(date: string) {
  return useQuery<MacroDistributionResponse>({
    queryKey: analyticsKeys.macros(date),
    queryFn: () => analyticsService.getMacroDistribution(date),
    enabled: !!date,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get macro distribution for a date range
 */
export function useMacroDistributionRange(startDate: string, endDate: string) {
  return useQuery<MacroDistributionResponse>({
    queryKey: analyticsKeys.macros(undefined, startDate, endDate),
    queryFn: () => analyticsService.getMacroDistributionRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get dashboard summary
 */
export function useDashboardSummary() {
  return useQuery<DashboardSummaryResponse>({
    queryKey: analyticsKeys.dashboard(),
    queryFn: () => analyticsService.getDashboardSummary(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

/**
 * Hook to get workout analytics summary
 */
export function useWorkoutSummary(period: Period = '30d') {
  return useQuery<WorkoutSummaryResponse>({
    queryKey: analyticsKeys.workouts(period),
    queryFn: () => analyticsService.getWorkoutSummary(period),
    staleTime: 5 * 60 * 1000,
  });
}

export default {
  useWeightTrend,
  useBodyCompositionTrend,
  useCalorieIntakeTrend,
  useMacroDistribution,
  useMacroDistributionRange,
  useDashboardSummary,
  useWorkoutSummary,
};

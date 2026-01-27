import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayService, {
  type DaySummary,
  type DayRangeResponse,
  type WeekResponse,
  type NavigationContext,
  type DayGoalsDetail,
  type ActivityLevelOverrideResponse,
} from '../services/dayService';
import type { ActivityLevel } from '../types';

// =============================================================================
// Query Keys
// =============================================================================

export const dayKeys = {
  all: ['days'] as const,
  today: () => [...dayKeys.all, 'today'] as const,
  details: () => [...dayKeys.all, 'detail'] as const,
  detail: (date: string) => [...dayKeys.details(), date] as const,
  range: (startDate: string, endDate: string) => [...dayKeys.all, 'range', startDate, endDate] as const,
  week: (weekOf?: string) => [...dayKeys.all, 'week', weekOf] as const,
  navigation: (date?: string) => [...dayKeys.all, 'navigation', date] as const,
  goals: (date?: string) => [...dayKeys.all, 'goals', date] as const,
};

// =============================================================================
// Day Hooks
// =============================================================================

/**
 * Hook to get today's summary
 */
export function useToday() {
  return useQuery<DaySummary>({
    queryKey: dayKeys.today(),
    queryFn: () => dayService.getToday(),
    // Refetch every minute to keep data fresh
    refetchInterval: 60 * 1000,
    // Keep data for 30 seconds before considering it stale
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get a specific day's summary
 */
export function useDay(date: string | undefined) {
  return useQuery<DaySummary>({
    queryKey: dayKeys.detail(date!),
    queryFn: () => dayService.getDay(date!),
    enabled: !!date,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get day range data (for progress screens)
 */
export function useDayRange(startDate: string, endDate: string, includeDetails = false) {
  return useQuery<DayRangeResponse>({
    queryKey: [...dayKeys.range(startDate, endDate), includeDetails],
    queryFn: () => dayService.getDayRange(startDate, endDate, includeDetails),
    enabled: !!startDate && !!endDate,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get week overview (calendar view)
 */
export function useWeek(weekOf?: string) {
  return useQuery<WeekResponse>({
    queryKey: dayKeys.week(weekOf),
    queryFn: () => dayService.getWeek(weekOf),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get navigation context for day navigation
 */
export function useNavigationContext(date?: string) {
  return useQuery<NavigationContext>({
    queryKey: dayKeys.navigation(date),
    queryFn: () => dayService.getNavigationContext(date),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get detailed goals calculation for a date
 */
export function useDayGoals(date?: string) {
  return useQuery<DayGoalsDetail>({
    queryKey: dayKeys.goals(date),
    queryFn: () => dayService.getGoals(date),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to set activity level override for a day
 */
export function useSetActivityLevel() {
  const queryClient = useQueryClient();

  return useMutation<
    ActivityLevelOverrideResponse,
    Error,
    { date: string; activityLevel: ActivityLevel }
  >({
    mutationFn: ({ date, activityLevel }) => dayService.setActivityLevel(date, activityLevel),
    onSuccess: (response, variables) => {
      // Update day cache with new goals
      queryClient.setQueryData<DaySummary>(dayKeys.detail(variables.date), (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            activityLevel: response.activityLevel,
            goals: response.goals,
          };
        }
        return oldData;
      });
      // If today, also update today query
      const today = new Date().toISOString().split('T')[0];
      if (variables.date === today) {
        queryClient.invalidateQueries({ queryKey: dayKeys.today() });
      }
      // Invalidate goals detail
      queryClient.invalidateQueries({ queryKey: dayKeys.goals(variables.date) });
    },
  });
}

/**
 * Hook to remove activity level override for a day
 */
export function useRemoveActivityLevel() {
  const queryClient = useQueryClient();

  return useMutation<ActivityLevelOverrideResponse, Error, string>({
    mutationFn: (date) => dayService.removeActivityLevel(date),
    onSuccess: (response, date) => {
      // Update day cache
      queryClient.setQueryData<DaySummary>(dayKeys.detail(date), (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            activityLevel: response.activityLevel,
            goals: response.goals,
          };
        }
        return oldData;
      });
      // If today, also update today query
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        queryClient.invalidateQueries({ queryKey: dayKeys.today() });
      }
      // Invalidate goals detail
      queryClient.invalidateQueries({ queryKey: dayKeys.goals(date) });
    },
  });
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Parse a YYYY-MM-DD date string to a Date object at midnight local time
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Hook to get formatted date for display
 */
export function useFormattedDate(date: string) {
  const dateObj = parseDateString(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateObj.getTime() === today.getTime()) {
    return { label: 'Today', isToday: true, isPast: false };
  }
  if (dateObj.getTime() === yesterday.getTime()) {
    return { label: 'Yesterday', isToday: false, isPast: true };
  }
  if (dateObj.getTime() === tomorrow.getTime()) {
    return { label: 'Tomorrow', isToday: false, isPast: false };
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

  return {
    label: dateObj.toLocaleDateString('en-US', options),
    isToday: false,
    isPast: dateObj < today,
  };
}

/**
 * Get date string in YYYY-MM-DD format (using local timezone)
 */
export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a date and return YYYY-MM-DD string (using local timezone)
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return getDateString(d);
}

export default {
  useToday,
  useDay,
  useDayRange,
  useWeek,
  useNavigationContext,
  useDayGoals,
  useSetActivityLevel,
  useRemoveActivityLevel,
  useFormattedDate,
  getDateString,
  addDays,
};

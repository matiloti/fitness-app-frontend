import api from './api';
import type { ActivityLevel, MealType, WorkoutType } from '../types';

// =============================================================================
// Day Service Types
// =============================================================================

export interface DayActivityLevel {
  level: ActivityLevel;
  multiplier: number;
  isOverride: boolean;
}

export interface DayGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayConsumed {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayRemaining {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayProgress {
  caloriesPercent: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export interface DayMealSummary {
  id: string;
  mealType: MealType;
  isCheatMeal: boolean;
  totals: {
    calories: number;
    protein: number;
  };
  itemCount: number;
}

export interface DayWorkoutSummary {
  id: string;
  workoutType: WorkoutType;
  name: string | null;
  durationMinutes: number;
  caloriesBurned: number;
}

export interface DayBodyMetrics {
  id: string;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  hasPhotos: boolean;
}

export interface DaySummary {
  date: string;
  dayId: string;
  activityLevel: DayActivityLevel;
  goals: DayGoals;
  consumed: DayConsumed;
  remaining: DayRemaining;
  progress: DayProgress;
  meals: DayMealSummary[];
  workouts: DayWorkoutSummary[];
  workoutCalories: number;
  netCalories: number;
  bodyMetrics: DayBodyMetrics | null;
}

export type AdherenceStatus = 'UNDER' | 'ON_TARGET' | 'OVER';

export interface DayRangeItem {
  date: string;
  activityLevel: ActivityLevel;
  isActivityOverride: boolean;
  goals: Pick<DayGoals, 'calories' | 'protein'>;
  consumed: Pick<DayConsumed, 'calories' | 'protein'>;
  adherence: {
    calories: AdherenceStatus;
    caloriesPercent: number;
  };
  mealCount: number;
  cheatMealCount: number;
  workoutCount: number;
  workoutCalories: number;
  hasBodyMetrics: boolean;
}

export interface DayRangeResponse {
  startDate: string;
  endDate: string;
  days: DayRangeItem[];
  summary: {
    totalDays: number;
    daysWithMeals: number;
    averageCalories: number;
    averageProtein: number;
    totalCheatMeals: number;
    totalWorkouts: number;
    totalWorkoutCalories: number;
    adherenceRate: number;
  };
}

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface WeekDay {
  date: string;
  dayOfWeek: DayOfWeek;
  adherence: AdherenceStatus;
  caloriesPercent: number;
  hasCheatMeal: boolean;
  hasBodyMetrics: boolean;
  hasWorkout: boolean;
}

export interface WeekResponse {
  weekStart: string;
  weekEnd: string;
  days: WeekDay[];
  weekSummary: {
    averageCalories: number;
    calorieGoal: number;
    adherenceRate: number;
    cheatMealCount: number;
    workoutCount: number;
    daysWithBodyMetrics: number;
  };
}

export interface NavigationContext {
  current: {
    date: string;
    isToday: boolean;
    hasMeals: boolean;
    hasWorkouts: boolean;
    hasBodyMetrics: boolean;
  };
  previous: {
    date: string;
    hasMeals: boolean;
  } | null;
  next: {
    date: string;
    hasMeals: boolean;
  } | null;
  firstDate: string | null;
  lastDate: string | null;
}

export interface DayGoalsDetail {
  date: string;
  profile: {
    sex: 'MALE' | 'FEMALE';
    heightCm: number;
    age: number;
  };
  latestWeight: number;
  weightDate: string;
  activityLevel: DayActivityLevel;
  fitnessGoal: {
    type: 'LOSE' | 'MAINTAIN' | 'GAIN';
    intensity: 'SLOW' | 'NORMAL' | 'HARD' | 'EXTREME' | null;
    adjustment: number;
  };
  calculations: {
    bmr: number;
    tdee: number;
    dailyCalorieGoal: number;
    macros: {
      protein: { grams: number; percent: number; calories: number };
      carbs: { grams: number; percent: number; calories: number };
      fat: { grams: number; percent: number; calories: number };
    };
  };
}

export interface ActivityLevelOverrideResponse {
  date: string;
  activityLevel: DayActivityLevel;
  goals: DayGoals;
  defaultActivityLevel?: {
    level: ActivityLevel;
    multiplier: number;
  };
}

// =============================================================================
// Day Service
// =============================================================================

export const dayService = {
  // Get today's summary
  getToday: async (): Promise<DaySummary> => {
    const response = await api.get<DaySummary>('/v1/days/today');
    return response.data;
  },

  // Get day summary for specific date
  getDay: async (date: string): Promise<DaySummary> => {
    const response = await api.get<DaySummary>(`/v1/days/${date}`);
    return response.data;
  },

  // Set activity level override for a day
  setActivityLevel: async (date: string, activityLevel: ActivityLevel): Promise<ActivityLevelOverrideResponse> => {
    const response = await api.put<ActivityLevelOverrideResponse>(`/v1/days/${date}/activity-level`, {
      activityLevel,
    });
    return response.data;
  },

  // Remove activity level override (use profile default)
  removeActivityLevel: async (date: string): Promise<ActivityLevelOverrideResponse> => {
    const response = await api.delete<ActivityLevelOverrideResponse>(`/v1/days/${date}/activity-level`);
    return response.data;
  },

  // Get day range
  getDayRange: async (startDate: string, endDate: string, includeDetails = false): Promise<DayRangeResponse> => {
    const response = await api.get<DayRangeResponse>('/v1/days/range', {
      params: { startDate, endDate, includeDetails },
    });
    return response.data;
  },

  // Get week overview
  getWeek: async (weekOf?: string): Promise<WeekResponse> => {
    const response = await api.get<WeekResponse>('/v1/days/week', {
      params: weekOf ? { weekOf } : {},
    });
    return response.data;
  },

  // Get navigation context
  getNavigationContext: async (date?: string): Promise<NavigationContext> => {
    const response = await api.get<NavigationContext>('/v1/days/navigate', {
      params: date ? { date } : {},
    });
    return response.data;
  },

  // Get goals detail for a date
  getGoals: async (date?: string): Promise<DayGoalsDetail> => {
    const response = await api.get<DayGoalsDetail>('/v1/days/goals', {
      params: date ? { date } : {},
    });
    return response.data;
  },
};

export default dayService;

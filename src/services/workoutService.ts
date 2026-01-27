import api from './api';
import type { WorkoutType } from '../types';

const WORKOUTS_BASE = '/v1/workouts';

// =============================================================================
// Request/Response Types
// =============================================================================

export interface WorkoutListItem {
  id: string;
  date: string;
  workoutType: WorkoutType;
  name: string | null;
  durationMinutes: number;
  caloriesBurnedEstimated: number | null;
  caloriesBurnedActual: number | null;
  caloriesBurned: number | null;
  notes: string | null;
}

export interface WorkoutTypeInfo {
  type: WorkoutType;
  metValue: number;
  description: string;
  estimatedCaloriesPerHour?: number;
}

export interface WorkoutDetail extends WorkoutListItem {
  workoutTypeInfo: WorkoutTypeInfo;
  calculationDetails: {
    weightUsed: number;
    metValue: number;
    formula: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutListSummary {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  avgDuration: number;
  avgCalories: number;
}

export interface WorkoutListResponse {
  content: WorkoutListItem[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  summary: WorkoutListSummary;
}

export interface WorkoutTypesResponse {
  workoutTypes: WorkoutTypeInfo[];
}

export interface CalorieEstimateResponse {
  workoutType: WorkoutType;
  durationMinutes: number;
  estimatedCalories: number;
  calculation: {
    weightUsed: number;
    metValue: number;
    formula: string;
  };
}

export interface WorkoutSummaryResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalWorkouts: number;
    totalDurationMinutes: number;
    totalCaloriesBurned: number;
    averageWorkoutsPerWeek: number;
    averageDurationMinutes: number;
    averageCaloriesBurned: number;
    longestWorkout: number;
    mostCaloriesBurned: number;
  };
  byType: {
    workoutType: WorkoutType;
    count: number;
    totalDuration: number;
    totalCalories: number;
    percentOfTotal: number;
  }[];
  weeklyTrend: {
    weekStart: string;
    workouts: number;
    calories: number;
  }[];
}

export interface CreateWorkoutRequest {
  date: string;
  workoutType: WorkoutType;
  name?: string;
  durationMinutes: number;
  caloriesBurnedActual?: number | null;
  notes?: string;
}

export interface UpdateWorkoutRequest {
  workoutType?: WorkoutType;
  name?: string;
  durationMinutes?: number;
  caloriesBurnedActual?: number | null;
  notes?: string;
  clearActualCalories?: boolean;
}

export interface WorkoutListParams {
  startDate?: string;
  endDate?: string;
  workoutType?: WorkoutType;
  page?: number;
  size?: number;
}

// =============================================================================
// Service
// =============================================================================

export const workoutService = {
  /**
   * List workouts with optional filters
   */
  list: async (params: WorkoutListParams = {}): Promise<WorkoutListResponse> => {
    const response = await api.get<WorkoutListResponse>(WORKOUTS_BASE, {
      params,
    });
    return response.data;
  },

  /**
   * Get workout details by ID
   */
  getById: async (id: string): Promise<WorkoutDetail> => {
    const response = await api.get<WorkoutDetail>(`${WORKOUTS_BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new workout
   */
  create: async (data: CreateWorkoutRequest): Promise<WorkoutDetail> => {
    const response = await api.post<WorkoutDetail>(WORKOUTS_BASE, data);
    return response.data;
  },

  /**
   * Update a workout
   */
  update: async (id: string, data: UpdateWorkoutRequest): Promise<WorkoutDetail> => {
    const response = await api.put<WorkoutDetail>(`${WORKOUTS_BASE}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a workout
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`${WORKOUTS_BASE}/${id}`);
  },

  /**
   * Get all workout types with MET values
   */
  getTypes: async (): Promise<WorkoutTypesResponse> => {
    const response = await api.get<WorkoutTypesResponse>(`${WORKOUTS_BASE}/types`);
    return response.data;
  },

  /**
   * Get calorie estimate for a workout
   */
  estimateCalories: async (
    workoutType: WorkoutType,
    durationMinutes: number
  ): Promise<CalorieEstimateResponse> => {
    const response = await api.get<CalorieEstimateResponse>(`${WORKOUTS_BASE}/estimate`, {
      params: { workoutType, durationMinutes },
    });
    return response.data;
  },

  /**
   * Get workout summary/analytics
   */
  getSummary: async (
    startDate?: string,
    endDate?: string
  ): Promise<WorkoutSummaryResponse> => {
    const response = await api.get<WorkoutSummaryResponse>(`${WORKOUTS_BASE}/summary`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export default workoutService;

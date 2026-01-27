import api from './api';
import type {
  Period,
  WeightTrendResponse,
  BodyCompositionTrendResponse,
  CalorieIntakeTrendResponse,
  MacroDistributionResponse,
  DashboardSummaryResponse,
  WorkoutSummaryResponse,
} from '../types/analytics';

const ANALYTICS_BASE = '/v1/analytics';

export const analyticsService = {
  /**
   * Get weight trend data for charting
   */
  getWeightTrend: async (period: Period = '30d'): Promise<WeightTrendResponse> => {
    const response = await api.get<WeightTrendResponse>(
      `${ANALYTICS_BASE}/weight`,
      { params: { period } }
    );
    return response.data;
  },

  /**
   * Get body composition trend data
   */
  getBodyCompositionTrend: async (
    period: Period = '30d',
    metrics?: string
  ): Promise<BodyCompositionTrendResponse> => {
    const response = await api.get<BodyCompositionTrendResponse>(
      `${ANALYTICS_BASE}/body-composition`,
      { params: { period, metrics } }
    );
    return response.data;
  },

  /**
   * Get calorie intake trend data
   */
  getCalorieIntakeTrend: async (
    period: Period = '30d'
  ): Promise<CalorieIntakeTrendResponse> => {
    const response = await api.get<CalorieIntakeTrendResponse>(
      `${ANALYTICS_BASE}/calories`,
      { params: { period } }
    );
    return response.data;
  },

  /**
   * Get macro distribution for a single day
   */
  getMacroDistribution: async (date: string): Promise<MacroDistributionResponse> => {
    const response = await api.get<MacroDistributionResponse>(
      `${ANALYTICS_BASE}/macros`,
      { params: { date } }
    );
    return response.data;
  },

  /**
   * Get macro distribution for a date range (average)
   */
  getMacroDistributionRange: async (
    startDate: string,
    endDate: string
  ): Promise<MacroDistributionResponse> => {
    const response = await api.get<MacroDistributionResponse>(
      `${ANALYTICS_BASE}/macros`,
      { params: { startDate, endDate } }
    );
    return response.data;
  },

  /**
   * Get dashboard summary for home screen
   */
  getDashboardSummary: async (): Promise<DashboardSummaryResponse> => {
    const response = await api.get<DashboardSummaryResponse>(
      `${ANALYTICS_BASE}/summary`
    );
    return response.data;
  },

  /**
   * Get workout analytics summary
   */
  getWorkoutSummary: async (period: Period = '30d'): Promise<WorkoutSummaryResponse> => {
    const response = await api.get<WorkoutSummaryResponse>(
      `${ANALYTICS_BASE}/workouts`,
      { params: { period } }
    );
    return response.data;
  },
};

export default analyticsService;

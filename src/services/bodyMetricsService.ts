import api from './api';
import type { BodyMetrics } from '../types';

const BODY_METRICS_BASE = '/v1/body-metrics';

export interface CreateBodyMetricsRequest {
  date: string;
  weightKg?: number;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  notes?: string;
}

export const bodyMetricsService = {
  /**
   * Create or update body metrics for a date
   */
  createBodyMetrics: async (data: CreateBodyMetricsRequest): Promise<BodyMetrics> => {
    const response = await api.post<BodyMetrics>(BODY_METRICS_BASE, data);
    return response.data;
  },

  /**
   * Get the most recent body metrics entry
   */
  getLatest: async (): Promise<BodyMetrics | null> => {
    try {
      const response = await api.get<BodyMetrics>(`${BODY_METRICS_BASE}/latest`);
      return response.data;
    } catch (error) {
      // 404 means no entries exist
      return null;
    }
  },
};

export default bodyMetricsService;

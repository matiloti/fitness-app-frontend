import api from './api';
import type { BodyMetrics, ProgressPhoto } from '../types';
import type {
  Period,
  BodyMetricsListResponse,
  BodyMetricsTrendsResponse,
  PhotoTimelineResponse,
} from '../types/analytics';

const BODY_METRICS_BASE = '/v1/body-metrics';

export interface CreateBodyMetricsRequest {
  date: string;
  weightKg?: number;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  notes?: string;
}

export interface UpdateBodyMetricsRequest {
  weightKg?: number;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  notes?: string;
}

export interface BodyMetricsListParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  hasPhotos?: boolean;
}

export interface AddPhotoRequest {
  position: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';
  imageUrl: string;
}

export const bodyMetricsService = {
  /**
   * List body metrics entries with optional filters
   */
  list: async (params: BodyMetricsListParams = {}): Promise<BodyMetricsListResponse> => {
    const response = await api.get<BodyMetricsListResponse>(BODY_METRICS_BASE, {
      params,
    });
    return response.data;
  },

  /**
   * Get body metrics entry by ID
   */
  getById: async (id: string): Promise<BodyMetrics> => {
    const response = await api.get<BodyMetrics>(`${BODY_METRICS_BASE}/${id}`);
    return response.data;
  },

  /**
   * Get body metrics for a specific date
   */
  getByDate: async (date: string): Promise<BodyMetrics | null> => {
    try {
      const response = await api.get<BodyMetrics>(`${BODY_METRICS_BASE}/date/${date}`);
      return response.data;
    } catch (error) {
      // 404 means no entry for this date
      return null;
    }
  },

  /**
   * Create or update body metrics for a date
   */
  createBodyMetrics: async (data: CreateBodyMetricsRequest): Promise<BodyMetrics> => {
    const response = await api.post<BodyMetrics>(BODY_METRICS_BASE, data);
    return response.data;
  },

  /**
   * Update body metrics entry
   */
  updateBodyMetrics: async (
    id: string,
    data: UpdateBodyMetricsRequest
  ): Promise<BodyMetrics> => {
    const response = await api.put<BodyMetrics>(`${BODY_METRICS_BASE}/${id}`, data);
    return response.data;
  },

  /**
   * Delete body metrics entry
   */
  deleteBodyMetrics: async (id: string): Promise<void> => {
    await api.delete(`${BODY_METRICS_BASE}/${id}`);
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

  /**
   * Get body metrics trends
   */
  getTrends: async (period: Period = '30d'): Promise<BodyMetricsTrendsResponse> => {
    const response = await api.get<BodyMetricsTrendsResponse>(
      `${BODY_METRICS_BASE}/trends`,
      { params: { period } }
    );
    return response.data;
  },

  // Progress Photos

  /**
   * Add a progress photo to a body metrics entry
   */
  addPhoto: async (metricsId: string, data: AddPhotoRequest): Promise<ProgressPhoto> => {
    const response = await api.post<ProgressPhoto>(
      `${BODY_METRICS_BASE}/${metricsId}/photos`,
      data
    );
    return response.data;
  },

  /**
   * Get photos for a body metrics entry
   */
  getPhotos: async (metricsId: string): Promise<ProgressPhoto[]> => {
    const response = await api.get<ProgressPhoto[]>(
      `${BODY_METRICS_BASE}/${metricsId}/photos`
    );
    return response.data;
  },

  /**
   * Delete a progress photo
   */
  deletePhoto: async (metricsId: string, photoId: string): Promise<void> => {
    await api.delete(`${BODY_METRICS_BASE}/${metricsId}/photos/${photoId}`);
  },

  /**
   * Get photo timeline for date range
   */
  getPhotoTimeline: async (
    startDate?: string,
    endDate?: string,
    position?: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT'
  ): Promise<PhotoTimelineResponse> => {
    const response = await api.get<PhotoTimelineResponse>(
      `${BODY_METRICS_BASE}/photos`,
      { params: { startDate, endDate, position } }
    );
    return response.data;
  },
};

export default bodyMetricsService;

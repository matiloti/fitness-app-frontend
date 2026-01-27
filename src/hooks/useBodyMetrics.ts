import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bodyMetricsService, {
  type CreateBodyMetricsRequest,
  type UpdateBodyMetricsRequest,
  type BodyMetricsListParams,
  type AddPhotoRequest,
} from '../services/bodyMetricsService';
import type { BodyMetrics, ProgressPhoto } from '../types';
import type {
  Period,
  BodyMetricsListResponse,
  BodyMetricsTrendsResponse,
  PhotoTimelineResponse,
} from '../types/analytics';

// =============================================================================
// Query Keys
// =============================================================================

export const bodyMetricsKeys = {
  all: ['bodyMetrics'] as const,
  lists: () => [...bodyMetricsKeys.all, 'list'] as const,
  list: (params: BodyMetricsListParams) => [...bodyMetricsKeys.lists(), params] as const,
  details: () => [...bodyMetricsKeys.all, 'detail'] as const,
  detail: (id: string) => [...bodyMetricsKeys.details(), id] as const,
  byDate: (date: string) => [...bodyMetricsKeys.all, 'date', date] as const,
  latest: () => [...bodyMetricsKeys.all, 'latest'] as const,
  trends: (period: Period) => [...bodyMetricsKeys.all, 'trends', period] as const,
  photos: () => [...bodyMetricsKeys.all, 'photos'] as const,
  photoTimeline: (params: { startDate?: string; endDate?: string; position?: string }) =>
    [...bodyMetricsKeys.photos(), params] as const,
};

// =============================================================================
// List & Detail Hooks
// =============================================================================

/**
 * Hook to list body metrics with optional filters
 */
export function useBodyMetricsList(params: BodyMetricsListParams = {}) {
  return useQuery<BodyMetricsListResponse>({
    queryKey: bodyMetricsKeys.list(params),
    queryFn: () => bodyMetricsService.list(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get body metrics by ID
 */
export function useBodyMetricsById(id: string | undefined) {
  return useQuery<BodyMetrics>({
    queryKey: bodyMetricsKeys.detail(id!),
    queryFn: () => bodyMetricsService.getById(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get body metrics for a specific date
 */
export function useBodyMetricsByDate(date: string | undefined) {
  return useQuery<BodyMetrics | null>({
    queryKey: bodyMetricsKeys.byDate(date!),
    queryFn: () => bodyMetricsService.getByDate(date!),
    enabled: !!date,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get the latest body metrics entry
 */
export function useLatestBodyMetrics() {
  return useQuery<BodyMetrics | null>({
    queryKey: bodyMetricsKeys.latest(),
    queryFn: () => bodyMetricsService.getLatest(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get body metrics trends
 */
export function useBodyMetricsTrends(period: Period = '30d') {
  return useQuery<BodyMetricsTrendsResponse>({
    queryKey: bodyMetricsKeys.trends(period),
    queryFn: () => bodyMetricsService.getTrends(period),
    staleTime: 60 * 1000,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to create or update body metrics
 */
export function useCreateBodyMetrics() {
  const queryClient = useQueryClient();

  return useMutation<BodyMetrics, Error, CreateBodyMetricsRequest>({
    mutationFn: (data) => bodyMetricsService.createBodyMetrics(data),
    onSuccess: (result, variables) => {
      // Update latest
      queryClient.setQueryData<BodyMetrics | null>(
        bodyMetricsKeys.latest(),
        (old) => {
          if (!old || new Date(result.date) >= new Date(old.date)) {
            return result;
          }
          return old;
        }
      );
      // Update by date
      queryClient.setQueryData(bodyMetricsKeys.byDate(variables.date), result);
      // Invalidate lists and trends
      queryClient.invalidateQueries({ queryKey: bodyMetricsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bodyMetricsKeys.all, predicate: (query) =>
        query.queryKey[1] === 'trends'
      });
    },
  });
}

/**
 * Hook to update body metrics
 */
export function useUpdateBodyMetrics() {
  const queryClient = useQueryClient();

  return useMutation<
    BodyMetrics,
    Error,
    { id: string; data: UpdateBodyMetricsRequest }
  >({
    mutationFn: ({ id, data }) => bodyMetricsService.updateBodyMetrics(id, data),
    onSuccess: (result) => {
      // Update detail
      queryClient.setQueryData(bodyMetricsKeys.detail(result.id), result);
      // Update by date
      queryClient.setQueryData(bodyMetricsKeys.byDate(result.date), result);
      // Invalidate lists and trends
      queryClient.invalidateQueries({ queryKey: bodyMetricsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bodyMetricsKeys.latest() });
      queryClient.invalidateQueries({ queryKey: bodyMetricsKeys.all, predicate: (query) =>
        query.queryKey[1] === 'trends'
      });
    },
  });
}

/**
 * Hook to delete body metrics
 */
export function useDeleteBodyMetrics() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => bodyMetricsService.deleteBodyMetrics(id),
    onSuccess: () => {
      // Invalidate all body metrics queries
      queryClient.invalidateQueries({ queryKey: bodyMetricsKeys.all });
    },
  });
}

// =============================================================================
// Photo Hooks
// =============================================================================

/**
 * Hook to get photo timeline
 */
export function usePhotoTimeline(params: {
  startDate?: string;
  endDate?: string;
  position?: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';
} = {}) {
  return useQuery<PhotoTimelineResponse>({
    queryKey: bodyMetricsKeys.photoTimeline(params),
    queryFn: () =>
      bodyMetricsService.getPhotoTimeline(
        params.startDate,
        params.endDate,
        params.position
      ),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to add a progress photo
 */
export function useAddPhoto() {
  const queryClient = useQueryClient();

  return useMutation<
    ProgressPhoto,
    Error,
    { metricsId: string; data: AddPhotoRequest }
  >({
    mutationFn: ({ metricsId, data }) =>
      bodyMetricsService.addPhoto(metricsId, data),
    onSuccess: (result, variables) => {
      // Invalidate the metrics detail to get updated photos
      queryClient.invalidateQueries({
        queryKey: bodyMetricsKeys.detail(variables.metricsId),
      });
      // Invalidate photo timeline
      queryClient.invalidateQueries({ queryKey: bodyMetricsKeys.photos() });
      // Invalidate lists (for hasPhotos field)
      queryClient.invalidateQueries({ queryKey: bodyMetricsKeys.lists() });
    },
  });
}

/**
 * Hook to delete a progress photo
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { metricsId: string; photoId: string }>({
    mutationFn: ({ metricsId, photoId }) =>
      bodyMetricsService.deletePhoto(metricsId, photoId),
    onSuccess: (_, variables) => {
      // Invalidate the metrics detail
      queryClient.invalidateQueries({
        queryKey: bodyMetricsKeys.detail(variables.metricsId),
      });
      // Invalidate photo timeline
      queryClient.invalidateQueries({ queryKey: bodyMetricsKeys.photos() });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: bodyMetricsKeys.lists() });
    },
  });
}

export default {
  useBodyMetricsList,
  useBodyMetricsById,
  useBodyMetricsByDate,
  useLatestBodyMetrics,
  useBodyMetricsTrends,
  useCreateBodyMetrics,
  useUpdateBodyMetrics,
  useDeleteBodyMetrics,
  usePhotoTimeline,
  useAddPhoto,
  useDeletePhoto,
};

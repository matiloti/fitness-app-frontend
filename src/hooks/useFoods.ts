import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import foodService, {
  type FoodListParams,
  type CreateFoodRequest,
  type UpdateFoodRequest,
  type CreatePortionRequest,
  type BrandListParams,
  type CreateBrandRequest,
  type UpdateBrandRequest,
  type FoodListResponse,
  type FoodDetail,
  type CategoryListResponse,
  type RecentFoodsResponse,
  type BrandListResponse,
  type Portion,
  type BrandDetail,
} from '../services/foodService';

// =============================================================================
// Query Keys
// =============================================================================

export const foodKeys = {
  all: ['foods'] as const,
  lists: () => [...foodKeys.all, 'list'] as const,
  list: (params: FoodListParams) => [...foodKeys.lists(), params] as const,
  details: () => [...foodKeys.all, 'detail'] as const,
  detail: (id: string) => [...foodKeys.details(), id] as const,
  recent: () => [...foodKeys.all, 'recent'] as const,
  categories: () => ['categories'] as const,
  brands: () => ['brands'] as const,
  brandList: (params: BrandListParams) => [...foodKeys.brands(), 'list', params] as const,
  brandDetail: (id: number) => [...foodKeys.brands(), 'detail', id] as const,
};

// =============================================================================
// Food Hooks
// =============================================================================

/**
 * Hook to search and list foods with pagination
 */
export function useFoods(params: FoodListParams = {}, enabled = true) {
  return useQuery<FoodListResponse>({
    queryKey: foodKeys.list(params),
    queryFn: () => foodService.getFoods(params),
    enabled,
  });
}

/**
 * Hook to search foods with infinite scroll
 */
export function useFoodsInfinite(params: Omit<FoodListParams, 'page'> = {}) {
  return useInfiniteQuery<FoodListResponse>({
    queryKey: foodKeys.list({ ...params, page: 'infinite' as unknown as number }),
    queryFn: ({ pageParam = 0 }) =>
      foodService.getFoods({ ...params, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.page.number < lastPage.page.totalPages - 1) {
        return lastPage.page.number + 1;
      }
      return undefined;
    },
  });
}

/**
 * Hook to get food details by ID
 */
export function useFood(id: string | undefined) {
  return useQuery<FoodDetail>({
    queryKey: foodKeys.detail(id!),
    queryFn: () => foodService.getFood(id!),
    enabled: !!id,
  });
}

/**
 * Hook to get recently used foods
 */
export function useRecentFoods(limit = 20) {
  return useQuery<RecentFoodsResponse>({
    queryKey: [...foodKeys.recent(), limit],
    queryFn: () => foodService.getRecentFoods(limit),
  });
}

/**
 * Hook to get food categories (public, cacheable)
 */
export function useCategories() {
  return useQuery<CategoryListResponse>({
    queryKey: foodKeys.categories(),
    queryFn: () => foodService.getCategories(),
    staleTime: 1000 * 60 * 60, // 1 hour - categories rarely change
  });
}

/**
 * Hook to create a new food
 */
export function useCreateFood() {
  const queryClient = useQueryClient();

  return useMutation<FoodDetail, Error, CreateFoodRequest>({
    mutationFn: (data) => foodService.createFood(data),
    onSuccess: () => {
      // Invalidate food lists
      queryClient.invalidateQueries({ queryKey: foodKeys.lists() });
    },
  });
}

/**
 * Hook to update a food
 */
export function useUpdateFood() {
  const queryClient = useQueryClient();

  return useMutation<FoodDetail, Error, { id: string; data: UpdateFoodRequest }>({
    mutationFn: ({ id, data }) => foodService.updateFood(id, data),
    onSuccess: (_, variables) => {
      // Invalidate this food's detail and food lists
      queryClient.invalidateQueries({ queryKey: foodKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: foodKeys.lists() });
    },
  });
}

/**
 * Hook to delete a food
 */
export function useDeleteFood() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => foodService.deleteFood(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: foodKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: foodKeys.lists() });
    },
  });
}

// =============================================================================
// Portion Hooks
// =============================================================================

/**
 * Hook to get portions for a food
 */
export function usePortions(foodId: string | undefined) {
  return useQuery<Portion[]>({
    queryKey: [...foodKeys.detail(foodId!), 'portions'],
    queryFn: () => foodService.getPortions(foodId!),
    enabled: !!foodId,
  });
}

/**
 * Hook to add a portion to a food
 */
export function useAddPortion() {
  const queryClient = useQueryClient();

  return useMutation<Portion, Error, { foodId: string; data: CreatePortionRequest }>({
    mutationFn: ({ foodId, data }) => foodService.addPortion(foodId, data),
    onSuccess: (_, variables) => {
      // Invalidate the food detail to refresh portions
      queryClient.invalidateQueries({ queryKey: foodKeys.detail(variables.foodId) });
    },
  });
}

/**
 * Hook to delete a portion from a food
 */
export function useDeletePortion() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { foodId: string; portionId: number }>({
    mutationFn: ({ foodId, portionId }) => foodService.deletePortion(foodId, portionId),
    onSuccess: (_, variables) => {
      // Invalidate the food detail to refresh portions
      queryClient.invalidateQueries({ queryKey: foodKeys.detail(variables.foodId) });
    },
  });
}

// =============================================================================
// Brand Hooks
// =============================================================================

/**
 * Hook to list brands
 */
export function useBrands(params: BrandListParams = {}) {
  return useQuery<BrandListResponse>({
    queryKey: foodKeys.brandList(params),
    queryFn: () => foodService.getBrands(params),
  });
}

/**
 * Hook to get brand details
 */
export function useBrand(id: number | undefined) {
  return useQuery<BrandDetail>({
    queryKey: foodKeys.brandDetail(id!),
    queryFn: () => foodService.getBrand(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create a brand
 */
export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation<BrandDetail, Error, CreateBrandRequest>({
    mutationFn: (data) => foodService.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.brands() });
    },
  });
}

/**
 * Hook to update a brand
 */
export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation<BrandDetail, Error, { id: number; data: UpdateBrandRequest }>({
    mutationFn: ({ id, data }) => foodService.updateBrand(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: foodKeys.brandDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: foodKeys.brands() });
    },
  });
}

export default {
  useFoods,
  useFoodsInfinite,
  useFood,
  useRecentFoods,
  useCategories,
  useCreateFood,
  useUpdateFood,
  useDeleteFood,
  usePortions,
  useAddPortion,
  useDeletePortion,
  useBrands,
  useBrand,
  useCreateBrand,
  useUpdateBrand,
};

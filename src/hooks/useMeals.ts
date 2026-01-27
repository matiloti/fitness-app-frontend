import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import mealService, {
  type MealListParams,
  type CreateMealRequest,
  type UpdateMealRequest,
  type CopyMealRequest,
  type AddMealItemRequest,
  type UpdateFoodItemRequest,
  type UpdateQuickEntryRequest,
  type QuickAddFoodRequest,
  type MealListResponse,
  type Meal,
  type MealItem,
} from '../services/mealService';
import { dayKeys } from './useDays';

// =============================================================================
// Query Keys
// =============================================================================

export const mealKeys = {
  all: ['meals'] as const,
  lists: () => [...mealKeys.all, 'list'] as const,
  list: (params: MealListParams) => [...mealKeys.lists(), params] as const,
  details: () => [...mealKeys.all, 'detail'] as const,
  detail: (id: string) => [...mealKeys.details(), id] as const,
};

// =============================================================================
// Meal Hooks
// =============================================================================

/**
 * Hook to list meals for a date range
 */
export function useMeals(params: MealListParams = {}) {
  return useQuery<MealListResponse>({
    queryKey: mealKeys.list(params),
    queryFn: () => mealService.getMeals(params),
  });
}

/**
 * Hook to get meal details by ID
 */
export function useMeal(id: string | undefined) {
  return useQuery<Meal>({
    queryKey: mealKeys.detail(id!),
    queryFn: () => mealService.getMeal(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create a new meal
 */
export function useCreateMeal() {
  const queryClient = useQueryClient();

  return useMutation<Meal, Error, CreateMealRequest>({
    mutationFn: (data) => mealService.createMeal(data),
    onSuccess: (meal) => {
      // Invalidate meal lists and day data
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dayKeys.detail(meal.date) });
      queryClient.invalidateQueries({ queryKey: dayKeys.today() });
    },
  });
}

/**
 * Hook to update meal properties
 */
export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation<Meal, Error, { id: string; data: UpdateMealRequest }>({
    mutationFn: ({ id, data }) => mealService.updateMeal(id, data),
    onSuccess: (meal, variables) => {
      // Update cache with new data
      queryClient.setQueryData(mealKeys.detail(variables.id), meal);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
    },
  });
}

/**
 * Hook to delete a meal
 */
export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; date: string }>({
    mutationFn: ({ id }) => mealService.deleteMeal(id),
    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: mealKeys.detail(variables.id) });
      // Invalidate lists and day data
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dayKeys.detail(variables.date) });
      queryClient.invalidateQueries({ queryKey: dayKeys.today() });
    },
  });
}

/**
 * Hook to copy a meal to another day
 */
export function useCopyMeal() {
  const queryClient = useQueryClient();

  return useMutation<Meal, Error, { id: string; data: CopyMealRequest }>({
    mutationFn: ({ id, data }) => mealService.copyMeal(id, data),
    onSuccess: (meal) => {
      // Invalidate target day and lists
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dayKeys.detail(meal.date) });
    },
  });
}

// =============================================================================
// Meal Item Hooks
// =============================================================================

/**
 * Hook to add an item to a meal with optimistic update
 */
export function useAddMealItem() {
  const queryClient = useQueryClient();

  return useMutation<MealItem, Error, { mealId: string; data: AddMealItemRequest }, { previousMeal: Meal | undefined }>({
    mutationFn: ({ mealId, data }) => mealService.addMealItem(mealId, data),
    onMutate: async ({ mealId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: mealKeys.detail(mealId) });

      // Snapshot the previous value
      const previousMeal = queryClient.getQueryData<Meal>(mealKeys.detail(mealId));

      // Optimistic update - add placeholder item
      if (previousMeal) {
        const optimisticItem: MealItem = {
          id: `temp-${Date.now()}`,
          type: data.type,
          nutrition: {
            calories: 0,
            fat: 0,
            carbs: 0,
            protein: 0,
          },
          ...(data.type === 'FOOD' && { quantity: (data as { quantity: number }).quantity }),
          ...(data.type === 'RECIPE' && { servings: (data as { servings: number }).servings }),
          ...(data.type === 'QUICK_ENTRY' && { name: (data as { name: string }).name }),
        };

        queryClient.setQueryData<Meal>(mealKeys.detail(mealId), {
          ...previousMeal,
          items: [...previousMeal.items, optimisticItem],
        });
      }

      return { previousMeal };
    },
    onError: (_, variables, context) => {
      // Rollback on error
      if (context?.previousMeal) {
        queryClient.setQueryData(mealKeys.detail(variables.mealId), context.previousMeal);
      }
    },
    onSuccess: (newItem, variables) => {
      // Update meal with actual server data
      const meal = queryClient.getQueryData<Meal>(mealKeys.detail(variables.mealId));
      if (meal) {
        // Replace temp item with actual item
        const items = meal.items.filter((item) => !item.id.startsWith('temp-'));
        queryClient.setQueryData<Meal>(mealKeys.detail(variables.mealId), {
          ...meal,
          items: [...items, newItem],
        });
      }
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dayKeys.all });
    },
  });
}

/**
 * Hook to update a meal item
 */
export function useUpdateMealItem() {
  const queryClient = useQueryClient();

  return useMutation<
    MealItem,
    Error,
    { mealId: string; itemId: string; data: UpdateFoodItemRequest | UpdateQuickEntryRequest },
    { previousMeal: Meal | undefined }
  >({
    mutationFn: ({ mealId, itemId, data }) => mealService.updateMealItem(mealId, itemId, data),
    onMutate: async ({ mealId }) => {
      await queryClient.cancelQueries({ queryKey: mealKeys.detail(mealId) });
      const previousMeal = queryClient.getQueryData<Meal>(mealKeys.detail(mealId));

      // Note: We don't do optimistic update for this because it's complex
      // The server will return updated nutrition values

      return { previousMeal };
    },
    onError: (_, variables, context) => {
      if (context?.previousMeal) {
        queryClient.setQueryData(mealKeys.detail(variables.mealId), context.previousMeal);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mealKeys.detail(variables.mealId) });
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dayKeys.all });
    },
  });
}

/**
 * Hook to delete a meal item with optimistic update
 */
export function useDeleteMealItem() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { mealId: string; itemId: string }, { previousMeal: Meal | undefined }>({
    mutationFn: ({ mealId, itemId }) => mealService.deleteMealItem(mealId, itemId),
    onMutate: async ({ mealId, itemId }) => {
      await queryClient.cancelQueries({ queryKey: mealKeys.detail(mealId) });
      const previousMeal = queryClient.getQueryData<Meal>(mealKeys.detail(mealId));

      if (previousMeal) {
        queryClient.setQueryData<Meal>(mealKeys.detail(mealId), {
          ...previousMeal,
          items: previousMeal.items.filter((item) => item.id !== itemId),
        });
      }

      return { previousMeal };
    },
    onError: (_, variables, context) => {
      if (context?.previousMeal) {
        queryClient.setQueryData(mealKeys.detail(variables.mealId), context.previousMeal);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dayKeys.all });
    },
  });
}

/**
 * Hook to quick add a food to a meal
 */
export function useQuickAddFood() {
  const queryClient = useQueryClient();

  return useMutation<MealItem, Error, { mealId: string; data: QuickAddFoodRequest }>({
    mutationFn: ({ mealId, data }) => mealService.quickAddFood(mealId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mealKeys.detail(variables.mealId) });
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dayKeys.all });
    },
  });
}

export default {
  useMeals,
  useMeal,
  useCreateMeal,
  useUpdateMeal,
  useDeleteMeal,
  useCopyMeal,
  useAddMealItem,
  useUpdateMealItem,
  useDeleteMealItem,
  useQuickAddFood,
};

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import recipeService, {
  type RecipeListParams,
  type RecipeListResponse,
  type RecipeDetail,
  type RecipeListItem,
  type CreateRecipeRequest,
  type UpdateRecipeRequest,
  type AddIngredientRequest,
  type UpdateIngredientRequest,
  type AddStepRequest,
  type UpdateStepRequest,
  type ReorderStepsRequest,
  type RecipeIngredient,
  type RecipeStep,
  type ReorderStepsResponse,
} from '../services/recipeService';

// =============================================================================
// Query Keys
// =============================================================================

export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (params: RecipeListParams) => [...recipeKeys.lists(), params] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
};

// =============================================================================
// Recipe List Hooks
// =============================================================================

/**
 * Hook to list recipes with pagination
 */
export function useRecipes(params: RecipeListParams = {}) {
  return useQuery<RecipeListResponse>({
    queryKey: recipeKeys.list(params),
    queryFn: () => recipeService.getRecipes(params),
  });
}

/**
 * Hook for infinite scroll recipe list
 */
export function useInfiniteRecipes(params: Omit<RecipeListParams, 'page'> = {}) {
  return useInfiniteQuery<RecipeListResponse>({
    queryKey: recipeKeys.list(params),
    queryFn: ({ pageParam = 0 }) =>
      recipeService.getRecipes({ ...params, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const { number, totalPages } = lastPage.page;
      return number < totalPages - 1 ? number + 1 : undefined;
    },
  });
}

/**
 * Hook to get recipe details
 */
export function useRecipe(id: string | undefined) {
  return useQuery<RecipeDetail>({
    queryKey: recipeKeys.detail(id!),
    queryFn: () => recipeService.getRecipe(id!),
    enabled: !!id,
  });
}

// =============================================================================
// Recipe Mutation Hooks
// =============================================================================

/**
 * Hook to create a new recipe
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation<RecipeDetail, Error, CreateRecipeRequest>({
    mutationFn: (data) => recipeService.createRecipe(data),
    onSuccess: () => {
      // Invalidate recipe lists to show the new recipe
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

/**
 * Hook to update a recipe
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation<RecipeDetail, Error, { id: string; data: UpdateRecipeRequest }>({
    mutationFn: ({ id, data }) => recipeService.updateRecipe(id, data),
    onSuccess: (recipe, variables) => {
      // Update cache with new data
      queryClient.setQueryData(recipeKeys.detail(variables.id), recipe);
      // Invalidate lists to update summary data
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

/**
 * Hook to delete a recipe
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => recipeService.deleteRecipe(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: recipeKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

// =============================================================================
// Ingredient Mutation Hooks
// =============================================================================

/**
 * Hook to add an ingredient to a recipe
 */
export function useAddIngredient() {
  const queryClient = useQueryClient();

  return useMutation<
    RecipeIngredient,
    Error,
    { recipeId: string; data: AddIngredientRequest }
  >({
    mutationFn: ({ recipeId, data }) => recipeService.addIngredient(recipeId, data),
    onSuccess: (_, variables) => {
      // Invalidate recipe detail to fetch updated data
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.recipeId) });
      // Invalidate lists for nutrition updates
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

/**
 * Hook to update an ingredient
 */
export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation<
    RecipeIngredient,
    Error,
    { recipeId: string; ingredientId: number; data: UpdateIngredientRequest }
  >({
    mutationFn: ({ recipeId, ingredientId, data }) =>
      recipeService.updateIngredient(recipeId, ingredientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.recipeId) });
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

/**
 * Hook to delete an ingredient with optimistic update
 */
export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { recipeId: string; ingredientId: number },
    { previousRecipe: RecipeDetail | undefined }
  >({
    mutationFn: ({ recipeId, ingredientId }) =>
      recipeService.deleteIngredient(recipeId, ingredientId),
    onMutate: async ({ recipeId, ingredientId }) => {
      await queryClient.cancelQueries({ queryKey: recipeKeys.detail(recipeId) });
      const previousRecipe = queryClient.getQueryData<RecipeDetail>(
        recipeKeys.detail(recipeId)
      );

      if (previousRecipe) {
        queryClient.setQueryData<RecipeDetail>(recipeKeys.detail(recipeId), {
          ...previousRecipe,
          ingredients: previousRecipe.ingredients.filter((i) => i.id !== ingredientId),
        });
      }

      return { previousRecipe };
    },
    onError: (_, variables, context) => {
      if (context?.previousRecipe) {
        queryClient.setQueryData(
          recipeKeys.detail(variables.recipeId),
          context.previousRecipe
        );
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.recipeId) });
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

// =============================================================================
// Step Mutation Hooks
// =============================================================================

/**
 * Hook to add a step to a recipe
 */
export function useAddStep() {
  const queryClient = useQueryClient();

  return useMutation<RecipeStep, Error, { recipeId: string; data: AddStepRequest }>({
    mutationFn: ({ recipeId, data }) => recipeService.addStep(recipeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.recipeId) });
    },
  });
}

/**
 * Hook to update a step
 */
export function useUpdateStep() {
  const queryClient = useQueryClient();

  return useMutation<
    RecipeStep,
    Error,
    { recipeId: string; stepId: number; data: UpdateStepRequest }
  >({
    mutationFn: ({ recipeId, stepId, data }) =>
      recipeService.updateStep(recipeId, stepId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.recipeId) });
    },
  });
}

/**
 * Hook to delete a step with optimistic update
 */
export function useDeleteStep() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { recipeId: string; stepId: number },
    { previousRecipe: RecipeDetail | undefined }
  >({
    mutationFn: ({ recipeId, stepId }) => recipeService.deleteStep(recipeId, stepId),
    onMutate: async ({ recipeId, stepId }) => {
      await queryClient.cancelQueries({ queryKey: recipeKeys.detail(recipeId) });
      const previousRecipe = queryClient.getQueryData<RecipeDetail>(
        recipeKeys.detail(recipeId)
      );

      if (previousRecipe) {
        const filteredSteps = previousRecipe.steps
          .filter((s) => s.id !== stepId)
          .map((s, index) => ({ ...s, stepNumber: index + 1 }));

        queryClient.setQueryData<RecipeDetail>(recipeKeys.detail(recipeId), {
          ...previousRecipe,
          steps: filteredSteps,
        });
      }

      return { previousRecipe };
    },
    onError: (_, variables, context) => {
      if (context?.previousRecipe) {
        queryClient.setQueryData(
          recipeKeys.detail(variables.recipeId),
          context.previousRecipe
        );
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.recipeId) });
    },
  });
}

/**
 * Hook to reorder steps
 */
export function useReorderSteps() {
  const queryClient = useQueryClient();

  return useMutation<
    ReorderStepsResponse,
    Error,
    { recipeId: string; data: ReorderStepsRequest }
  >({
    mutationFn: ({ recipeId, data }) => recipeService.reorderSteps(recipeId, data),
    onSuccess: (response, variables) => {
      // Update the recipe with new step order
      const recipe = queryClient.getQueryData<RecipeDetail>(
        recipeKeys.detail(variables.recipeId)
      );
      if (recipe) {
        queryClient.setQueryData<RecipeDetail>(recipeKeys.detail(variables.recipeId), {
          ...recipe,
          steps: response.steps,
        });
      }
    },
  });
}

export default {
  useRecipes,
  useInfiniteRecipes,
  useRecipe,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useAddIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useAddStep,
  useUpdateStep,
  useDeleteStep,
  useReorderSteps,
};

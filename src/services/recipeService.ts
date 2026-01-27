import api from './api';

// =============================================================================
// Recipe Service Types
// =============================================================================

export interface RecipeNutrition {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  salt?: number;
  sugar?: number;
  fiber?: number;
  saturatedFat?: number;
}

export interface RecipeFoodSummary {
  id: string;
  name: string;
  metricType: 'GRAMS' | 'MILLILITERS';
  nutritionPer100?: {
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
  };
}

export interface RecipePortionSummary {
  id: number;
  name: string;
  amountGrams: number;
}

export interface RecipeIngredient {
  id: number;
  food: RecipeFoodSummary;
  portion: RecipePortionSummary | null;
  quantity: number;
  amountGrams: number;
  nutrition: RecipeNutrition;
}

export interface RecipeStep {
  id: number;
  stepNumber: number;
  description: string;
  durationMinutes: number | null;
}

export interface RecipeListItem {
  id: string;
  name: string;
  description: string | null;
  totalServings: number;
  totalDurationMinutes: number | null;
  nutritionPerServing: RecipeNutrition;
  thumbnailUrl: string | null;
  ingredientCount: number;
  lastUsedAt: string | null;
}

export interface RecipeDetail {
  id: string;
  name: string;
  description: string | null;
  totalServings: number;
  totalDurationMinutes: number | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutritionPerServing: RecipeNutrition;
  nutritionTotal: RecipeNutrition;
  thumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageInfo {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface RecipeListResponse {
  content: RecipeListItem[];
  page: PageInfo;
}

// Request Types
export interface RecipeListParams {
  q?: string;
  page?: number;
  size?: number;
  sort?: 'recentlyUsed' | 'name' | 'createdAt';
}

export interface CreateIngredientInput {
  foodId: string;
  portionId?: number;
  quantity: number;
}

export interface CreateStepInput {
  description: string;
  durationMinutes?: number;
}

export interface CreateRecipeRequest {
  name: string;
  description?: string;
  totalServings: number;
  ingredients: CreateIngredientInput[];
  steps?: CreateStepInput[];
}

export interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  totalServings?: number;
}

export interface AddIngredientRequest {
  foodId: string;
  portionId?: number;
  quantity: number;
}

export interface UpdateIngredientRequest {
  portionId?: number;
  quantity?: number;
}

export interface AddStepRequest {
  description: string;
  durationMinutes?: number;
}

export interface UpdateStepRequest {
  description?: string;
  durationMinutes?: number;
}

export interface ReorderStepsRequest {
  stepIds: number[];
}

export interface ReorderStepsResponse {
  steps: RecipeStep[];
}

// =============================================================================
// Recipe Service
// =============================================================================

export const recipeService = {
  // List recipes
  getRecipes: async (params: RecipeListParams = {}): Promise<RecipeListResponse> => {
    const response = await api.get<RecipeListResponse>('/v1/recipes', { params });
    return response.data;
  },

  // Get recipe details
  getRecipe: async (id: string): Promise<RecipeDetail> => {
    const response = await api.get<RecipeDetail>(`/v1/recipes/${id}`);
    return response.data;
  },

  // Create recipe
  createRecipe: async (data: CreateRecipeRequest): Promise<RecipeDetail> => {
    const response = await api.post<RecipeDetail>('/v1/recipes', data);
    return response.data;
  },

  // Update recipe
  updateRecipe: async (id: string, data: UpdateRecipeRequest): Promise<RecipeDetail> => {
    const response = await api.put<RecipeDetail>(`/v1/recipes/${id}`, data);
    return response.data;
  },

  // Delete recipe
  deleteRecipe: async (id: string): Promise<void> => {
    await api.delete(`/v1/recipes/${id}`);
  },

  // Ingredients
  addIngredient: async (recipeId: string, data: AddIngredientRequest): Promise<RecipeIngredient> => {
    const response = await api.post<RecipeIngredient>(
      `/v1/recipes/${recipeId}/ingredients`,
      data
    );
    return response.data;
  },

  updateIngredient: async (
    recipeId: string,
    ingredientId: number,
    data: UpdateIngredientRequest
  ): Promise<RecipeIngredient> => {
    const response = await api.patch<RecipeIngredient>(
      `/v1/recipes/${recipeId}/ingredients/${ingredientId}`,
      data
    );
    return response.data;
  },

  deleteIngredient: async (recipeId: string, ingredientId: number): Promise<void> => {
    await api.delete(`/v1/recipes/${recipeId}/ingredients/${ingredientId}`);
  },

  // Steps
  addStep: async (recipeId: string, data: AddStepRequest): Promise<RecipeStep> => {
    const response = await api.post<RecipeStep>(`/v1/recipes/${recipeId}/steps`, data);
    return response.data;
  },

  updateStep: async (
    recipeId: string,
    stepId: number,
    data: UpdateStepRequest
  ): Promise<RecipeStep> => {
    const response = await api.patch<RecipeStep>(
      `/v1/recipes/${recipeId}/steps/${stepId}`,
      data
    );
    return response.data;
  },

  deleteStep: async (recipeId: string, stepId: number): Promise<void> => {
    await api.delete(`/v1/recipes/${recipeId}/steps/${stepId}`);
  },

  reorderSteps: async (
    recipeId: string,
    data: ReorderStepsRequest
  ): Promise<ReorderStepsResponse> => {
    const response = await api.put<ReorderStepsResponse>(
      `/v1/recipes/${recipeId}/steps/reorder`,
      data
    );
    return response.data;
  },
};

export default recipeService;

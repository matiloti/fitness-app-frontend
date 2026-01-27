import api from './api';
import type { MealType } from '../types';

// =============================================================================
// Meal Service Types
// =============================================================================

export interface MealTotals {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
}

export interface MealItemNutrition {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  salt?: number;
  sugar?: number;
  fiber?: number;
  saturatedFat?: number;
}

export interface MealItemFood {
  id: string;
  name: string;
  metricType: 'GRAMS' | 'MILLILITERS';
}

export interface MealItemRecipe {
  id: string;
  name: string;
  totalServings: number;
}

export interface MealItemPortion {
  id: number;
  name: string;
  amountGrams: number;
}

export type MealItemType = 'FOOD' | 'RECIPE' | 'QUICK_ENTRY';

export interface MealItem {
  id: string;
  type: MealItemType;
  food?: MealItemFood;
  recipe?: MealItemRecipe;
  portion?: MealItemPortion;
  quantity?: number;
  servings?: number;
  amountGrams?: number;
  name?: string; // for QUICK_ENTRY
  nutrition: MealItemNutrition;
  createdAt?: string;
  updatedAt?: string;
}

export interface Meal {
  id: string;
  dayId: string;
  date: string;
  mealType: MealType;
  isCheatMeal: boolean;
  items: MealItem[];
  totals: MealTotals;
  createdAt: string;
  updatedAt?: string;
}

export interface MealSummary {
  id: string;
  date: string;
  mealType: MealType;
  isCheatMeal: boolean;
  itemCount: number;
  totals: MealTotals;
}

export interface MealListResponse {
  meals: MealSummary[];
  summary: {
    totalMeals: number;
    totalCalories: number;
    cheatMealCount: number;
  };
}

// Request types
export interface CreateMealRequest {
  date: string; // YYYY-MM-DD
  mealType: MealType;
  isCheatMeal?: boolean;
}

export interface UpdateMealRequest {
  mealType?: MealType;
  isCheatMeal?: boolean;
}

export interface CopyMealRequest {
  targetDate: string; // YYYY-MM-DD
  targetMealType?: MealType;
}

export interface AddFoodItemRequest {
  type: 'FOOD';
  foodId: string;
  portionId?: number;
  quantity: number;
}

export interface AddRecipeItemRequest {
  type: 'RECIPE';
  recipeId: string;
  servings: number;
}

export interface AddQuickEntryRequest {
  type: 'QUICK_ENTRY';
  name: string;
  nutrition: {
    calories: number;
    fat?: number;
    carbs?: number;
    protein?: number;
  };
}

export type AddMealItemRequest = AddFoodItemRequest | AddRecipeItemRequest | AddQuickEntryRequest;

export interface UpdateFoodItemRequest {
  portionId?: number;
  quantity?: number;
}

export interface UpdateQuickEntryRequest {
  name?: string;
  nutrition?: {
    calories?: number;
    fat?: number;
    carbs?: number;
    protein?: number;
  };
}

export interface QuickAddFoodRequest {
  foodId: string;
  quantity?: number;
}

export interface MealListParams {
  startDate?: string;
  endDate?: string;
  mealType?: MealType;
}

// =============================================================================
// Meal Service
// =============================================================================

export const mealService = {
  // List meals
  getMeals: async (params: MealListParams = {}): Promise<MealListResponse> => {
    const response = await api.get<MealListResponse>('/v1/meals', { params });
    return response.data;
  },

  // Get meal details
  getMeal: async (id: string): Promise<Meal> => {
    const response = await api.get<Meal>(`/v1/meals/${id}`);
    return response.data;
  },

  // Create meal
  createMeal: async (data: CreateMealRequest): Promise<Meal> => {
    const response = await api.post<Meal>('/v1/meals', data);
    return response.data;
  },

  // Update meal
  updateMeal: async (id: string, data: UpdateMealRequest): Promise<Meal> => {
    const response = await api.patch<Meal>(`/v1/meals/${id}`, data);
    return response.data;
  },

  // Delete meal
  deleteMeal: async (id: string): Promise<void> => {
    await api.delete(`/v1/meals/${id}`);
  },

  // Copy meal to another day
  copyMeal: async (id: string, data: CopyMealRequest): Promise<Meal> => {
    const response = await api.post<Meal>(`/v1/meals/${id}/copy`, data);
    return response.data;
  },

  // Add item to meal
  addMealItem: async (mealId: string, data: AddMealItemRequest): Promise<MealItem> => {
    const response = await api.post<MealItem>(`/v1/meals/${mealId}/items`, data);
    return response.data;
  },

  // Update meal item
  updateMealItem: async (
    mealId: string,
    itemId: string,
    data: UpdateFoodItemRequest | UpdateQuickEntryRequest
  ): Promise<MealItem> => {
    const response = await api.patch<MealItem>(`/v1/meals/${mealId}/items/${itemId}`, data);
    return response.data;
  },

  // Delete meal item
  deleteMealItem: async (mealId: string, itemId: string): Promise<void> => {
    await api.delete(`/v1/meals/${mealId}/items/${itemId}`);
  },

  // Quick add food to meal
  quickAddFood: async (mealId: string, data: QuickAddFoodRequest): Promise<MealItem> => {
    const response = await api.post<MealItem>(`/v1/meals/${mealId}/items/quick-add`, data);
    return response.data;
  },
};

export default mealService;

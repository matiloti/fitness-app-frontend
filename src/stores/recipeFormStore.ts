import { create } from 'zustand';
import type { RecipeNutrition } from '../services/recipeService';

/**
 * Temporary ingredient data for recipe creation form
 */
export interface TempIngredient {
  tempId: string;
  foodId: string;
  foodName: string;
  portionId?: number;
  portionName?: string;
  quantity: number;
  amountGrams: number;
  nutrition: RecipeNutrition;
}

/**
 * Temporary step data for recipe creation form
 */
export interface TempStep {
  tempId: string;
  description: string;
  durationMinutes?: number;
}

interface RecipeFormState {
  // Form data
  name: string;
  description: string;
  servings: number;
  ingredients: TempIngredient[];
  steps: TempStep[];

  // Actions - Basic form
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setServings: (servings: number) => void;

  // Actions - Ingredients
  addIngredient: (ingredient: Omit<TempIngredient, 'tempId'>) => void;
  updateIngredient: (tempId: string, ingredient: Partial<TempIngredient>) => void;
  removeIngredient: (tempId: string) => void;

  // Actions - Steps
  addStep: (step: Omit<TempStep, 'tempId'>) => void;
  updateStep: (tempId: string, step: Partial<TempStep>) => void;
  removeStep: (tempId: string) => void;
  reorderSteps: (fromIndex: number, toIndex: number) => void;

  // Actions - Form management
  resetForm: () => void;
  hasChanges: () => boolean;
}

const initialState = {
  name: '',
  description: '',
  servings: 4,
  ingredients: [] as TempIngredient[],
  steps: [] as TempStep[],
};

/**
 * Generate a unique temporary ID for form items
 */
const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Zustand store for recipe creation form state
 * This allows sharing state between the create screen and modal screens
 * (add-ingredient, add-step) without relying on navigation params
 */
export const useRecipeFormStore = create<RecipeFormState>((set, get) => ({
  ...initialState,

  // Basic form actions
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setServings: (servings) => set({ servings }),

  // Ingredient actions
  addIngredient: (ingredient) =>
    set((state) => ({
      ingredients: [
        ...state.ingredients,
        { ...ingredient, tempId: generateTempId() },
      ],
    })),

  updateIngredient: (tempId, updates) =>
    set((state) => ({
      ingredients: state.ingredients.map((ing) =>
        ing.tempId === tempId ? { ...ing, ...updates } : ing
      ),
    })),

  removeIngredient: (tempId) =>
    set((state) => ({
      ingredients: state.ingredients.filter((ing) => ing.tempId !== tempId),
    })),

  // Step actions
  addStep: (step) =>
    set((state) => ({
      steps: [...state.steps, { ...step, tempId: generateTempId() }],
    })),

  updateStep: (tempId, updates) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.tempId === tempId ? { ...s, ...updates } : s
      ),
    })),

  removeStep: (tempId) =>
    set((state) => ({
      steps: state.steps.filter((s) => s.tempId !== tempId),
    })),

  reorderSteps: (fromIndex, toIndex) =>
    set((state) => {
      const newSteps = [...state.steps];
      const [removed] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, removed);
      return { steps: newSteps };
    }),

  // Form management
  resetForm: () => set(initialState),

  hasChanges: () => {
    const state = get();
    return (
      state.name !== '' ||
      state.description !== '' ||
      state.servings !== 4 ||
      state.ingredients.length > 0 ||
      state.steps.length > 0
    );
  },
}));

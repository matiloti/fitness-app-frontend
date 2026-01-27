import api from './api';
import type {
  MetricType,
} from '../types';

// =============================================================================
// Food Service Types
// =============================================================================

export interface CategorySummary {
  id: number;
  name: string;
  icon: string | null;
}

export interface BrandSummary {
  id: number;
  name: string;
}

export interface NutritionInfo {
  caloriesPer100: number;
  fatPer100: number;
  carbsPer100: number;
  proteinPer100: number;
  saltPer100: number | null;
  sugarPer100: number | null;
  fiberPer100: number | null;
  saturatedFatPer100: number | null;
}

export interface Portion {
  id: number;
  name: string;
  amountGrams: number;
}

export interface PageInfo {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface FoodListItem {
  id: string;
  name: string;
  category: CategorySummary | null;
  brand: BrandSummary | null;
  metricType: MetricType;
  nutrition: NutritionInfo;
  lastUsedAt: string | null;
}

export interface FoodDetail extends FoodListItem {
  portions: Portion[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodListResponse {
  content: FoodListItem[];
  page: PageInfo;
}

export interface RecentFood {
  id: string;
  name: string;
  nutrition: Pick<NutritionInfo, 'caloriesPer100' | 'fatPer100' | 'carbsPer100' | 'proteinPer100'>;
  defaultPortion: Portion | null;
  lastUsedAt: string;
  useCount: number;
}

export interface RecentFoodsResponse {
  foods: RecentFood[];
}

export interface CountrySummary {
  code: string;
  name: string;
}

export interface BrandDetail {
  id: number;
  name: string;
  description: string | null;
  photoUrl: string | null;
  country: CountrySummary | null;
  createdAt: string;
}

export interface BrandListResponse {
  content: BrandDetail[];
  page: PageInfo;
}

export interface CategoryListResponse {
  categories: CategorySummary[];
}

// Request types
export interface FoodListParams {
  q?: string;
  categoryId?: number;
  brandId?: number;
  page?: number;
  size?: number;
  sort?: 'recentlyUsed' | 'name' | 'createdAt';
}

export interface CreateFoodRequest {
  name: string;
  categoryId?: number;
  brandId?: number;
  metricType: MetricType;
  nutrition: {
    caloriesPer100: number;
    fatPer100: number;
    carbsPer100: number;
    proteinPer100: number;
    saltPer100?: number;
    sugarPer100?: number;
    fiberPer100?: number;
    saturatedFatPer100?: number;
  };
  portions?: Array<{
    name: string;
    amountGrams: number;
  }>;
}

export interface UpdateFoodRequest {
  name?: string;
  categoryId?: number;
  brandId?: number;
  nutrition?: {
    caloriesPer100: number;
    fatPer100: number;
    carbsPer100: number;
    proteinPer100: number;
    saltPer100?: number;
    sugarPer100?: number;
    fiberPer100?: number;
    saturatedFatPer100?: number;
  };
}

export interface CreatePortionRequest {
  name: string;
  amountGrams: number;
}

export interface BrandListParams {
  q?: string;
  page?: number;
  size?: number;
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
  photoUrl?: string;
  countryCode?: string;
}

export interface UpdateBrandRequest {
  name?: string;
  description?: string;
  photoUrl?: string;
  countryCode?: string;
}

// =============================================================================
// Food Service
// =============================================================================

export const foodService = {
  // Categories (public endpoint)
  getCategories: async (): Promise<CategoryListResponse> => {
    const response = await api.get<CategoryListResponse>('/v1/categories');
    return response.data;
  },

  // Foods
  getFoods: async (params: FoodListParams = {}): Promise<FoodListResponse> => {
    const response = await api.get<FoodListResponse>('/v1/foods', { params });
    return response.data;
  },

  getFood: async (id: string): Promise<FoodDetail> => {
    const response = await api.get<FoodDetail>(`/v1/foods/${id}`);
    return response.data;
  },

  createFood: async (data: CreateFoodRequest): Promise<FoodDetail> => {
    const response = await api.post<FoodDetail>('/v1/foods', data);
    return response.data;
  },

  updateFood: async (id: string, data: UpdateFoodRequest): Promise<FoodDetail> => {
    const response = await api.put<FoodDetail>(`/v1/foods/${id}`, data);
    return response.data;
  },

  deleteFood: async (id: string): Promise<void> => {
    await api.delete(`/v1/foods/${id}`);
  },

  getRecentFoods: async (limit = 20): Promise<RecentFoodsResponse> => {
    const response = await api.get<RecentFoodsResponse>('/v1/foods/recent', {
      params: { limit },
    });
    return response.data;
  },

  // Portions
  getPortions: async (foodId: string): Promise<Portion[]> => {
    const response = await api.get<Portion[]>(`/v1/foods/${foodId}/portions`);
    return response.data;
  },

  addPortion: async (foodId: string, data: CreatePortionRequest): Promise<Portion> => {
    const response = await api.post<Portion>(`/v1/foods/${foodId}/portions`, data);
    return response.data;
  },

  deletePortion: async (foodId: string, portionId: number): Promise<void> => {
    await api.delete(`/v1/foods/${foodId}/portions/${portionId}`);
  },

  // Brands
  getBrands: async (params: BrandListParams = {}): Promise<BrandListResponse> => {
    const response = await api.get<BrandListResponse>('/v1/brands', { params });
    return response.data;
  },

  getBrand: async (id: number): Promise<BrandDetail> => {
    const response = await api.get<BrandDetail>(`/v1/brands/${id}`);
    return response.data;
  },

  createBrand: async (data: CreateBrandRequest): Promise<BrandDetail> => {
    const response = await api.post<BrandDetail>('/v1/brands', data);
    return response.data;
  },

  updateBrand: async (id: number, data: UpdateBrandRequest): Promise<BrandDetail> => {
    const response = await api.put<BrandDetail>(`/v1/brands/${id}`, data);
    return response.data;
  },
};

export default foodService;

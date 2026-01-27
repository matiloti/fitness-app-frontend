// =============================================================================
// FitTrack Pro - TypeScript Types
// =============================================================================

// -----------------------------------------------------------------------------
// Auth Types
// -----------------------------------------------------------------------------
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  profile: Profile;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailRequest {
  password: string;
  newEmail: string;
}

// -----------------------------------------------------------------------------
// Profile Types
// -----------------------------------------------------------------------------
export interface Profile {
  id: string;
  email: string;
  name: string;
  photoUrl: string | null;
  country: Country | null;
  metrics: ProfileMetrics;
  activityLevel: ActivityLevelInfo;
  fitnessGoal: FitnessGoalInfo;
  calculations: ProfileCalculations | null;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  code: string;
  name: string;
}

export interface ProfileMetrics {
  dateOfBirth: string | null;
  age: number | null;
  sex: Sex | null;
  heightCm: number | null;
}

export interface ActivityLevelInfo {
  level: ActivityLevel;
  multiplier: number;
  description: string;
}

export interface FitnessGoalInfo {
  type: FitnessGoalType;
  intensity: FitnessGoalIntensity | null;
  dailyCalorieAdjustment: number;
  description: string;
}

export interface ProfileCalculations {
  bmr: number | null;
  tdee: number | null;
  dailyCalorieGoal: number | null;
  macros: Macros | null;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface UpdateProfileRequest {
  name?: string;
  photoUrl?: string;
  countryCode?: string;
}

export interface UpdateMetricsRequest {
  dateOfBirth: string;
  sex: Sex;
  heightCm: number;
}

export interface UpdateActivityLevelRequest {
  activityLevel: ActivityLevel;
}

export interface UpdateFitnessGoalRequest {
  type: FitnessGoalType;
  intensity?: FitnessGoalIntensity | null;
}

// -----------------------------------------------------------------------------
// Enum Types
// -----------------------------------------------------------------------------
export type Sex = 'MALE' | 'FEMALE';

export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHT'
  | 'MODERATE'
  | 'HARD'
  | 'VERY_HARD'
  | 'ATHLETE';

export type FitnessGoalType = 'LOSE' | 'MAINTAIN' | 'GAIN';

export type FitnessGoalIntensity = 'SLOW' | 'NORMAL' | 'HARD' | 'EXTREME';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export type WorkoutType =
  | 'STRENGTH'
  | 'CARDIO_RUNNING'
  | 'CARDIO_CYCLING'
  | 'CARDIO_SWIMMING'
  | 'HIIT'
  | 'YOGA'
  | 'PILATES'
  | 'SPORTS'
  | 'WALKING'
  | 'OTHER';

export type MetricType = 'GRAMS' | 'MILLILITERS';

// -----------------------------------------------------------------------------
// Reference Data Types
// -----------------------------------------------------------------------------
export interface ActivityLevelOption {
  level: ActivityLevel;
  multiplier: number;
  description: string;
}

export interface FitnessGoalOption {
  type: FitnessGoalType;
  intensity: FitnessGoalIntensity | null;
  adjustment: number;
  description: string;
}

// -----------------------------------------------------------------------------
// Food Types
// -----------------------------------------------------------------------------
export interface Food {
  id: string;
  name: string;
  categoryId?: number;
  brandId?: number;
  metricType: MetricType;
  caloriesPer100: number;
  fatPer100: number;
  carbsPer100: number;
  proteinPer100: number;
  saltPer100?: number;
  sugarPer100?: number;
  fiberPer100?: number;
  saturatedFatPer100?: number;
  portions?: FoodPortion[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodPortion {
  id: number;
  name: string;
  amountGrams: number;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  isSystem: boolean;
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
  photoUrl?: string;
  countryId?: number;
}

// -----------------------------------------------------------------------------
// Recipe Types
// -----------------------------------------------------------------------------
export interface Recipe {
  id: string;
  name: string;
  description?: string;
  totalServings: number;
  caloriesPerServing?: number;
  fatPerServing?: number;
  carbsPerServing?: number;
  proteinPerServing?: number;
  totalDurationMinutes?: number;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: number;
  food: Food;
  portion?: FoodPortion;
  quantity: number;
  amountGrams: number;
  displayOrder: number;
}

export interface RecipeStep {
  id: number;
  stepNumber: number;
  description: string;
  durationMinutes?: number;
}

// -----------------------------------------------------------------------------
// Meal Types
// -----------------------------------------------------------------------------
export interface Day {
  id: string;
  date: string;
  activityLevelOverride?: ActivityLevel;
  notes?: string;
  meals: Meal[];
  totalCalories: number;
  totalFat: number;
  totalCarbs: number;
  totalProtein: number;
  calorieGoal: number;
}

export interface Meal {
  id: string;
  mealType: MealType;
  isCheatMeal: boolean;
  displayOrder: number;
  items: MealItem[];
  totalCalories: number;
  totalFat: number;
  totalCarbs: number;
  totalProtein: number;
}

export interface MealItem {
  id: string;
  food?: Food;
  recipe?: Recipe;
  portion?: FoodPortion;
  quantity: number;
  amountGrams?: number;
  quickEntryName?: string;
  isQuickEntry: boolean;
  calories: number;
  fat?: number;
  carbs?: number;
  protein?: number;
  displayOrder: number;
}

// -----------------------------------------------------------------------------
// Body Metrics Types
// -----------------------------------------------------------------------------
export interface BodyMetrics {
  id: string;
  date: string;
  weightKg?: number;
  bodyFatPercentage?: number;
  bodyFatKg?: number;
  muscleMassPercentage?: number;
  muscleMassKg?: number;
  notes?: string;
  photos?: ProgressPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressPhoto {
  id: string;
  position: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';
  imageUrl: string;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Workout Types
// -----------------------------------------------------------------------------
export interface Workout {
  id: string;
  date: string;
  workoutType: WorkoutType;
  name?: string;
  durationMinutes: number;
  caloriesBurnedEstimated?: number;
  caloriesBurnedActual?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    timestamp: string;
    errors?: Record<string, string>;
  };
}

// -----------------------------------------------------------------------------
// Registration Flow Types
// -----------------------------------------------------------------------------
export interface RegistrationData {
  // Step 1: Account
  email: string;
  password: string;
  name: string;
  photoUrl?: string;
  countryCode?: string;
  // Step 2: Metrics
  dateOfBirth?: string;
  sex?: Sex;
  heightCm?: number;
  // Step 3: Activity Level
  activityLevel?: ActivityLevel;
  // Step 4: Goal
  fitnessGoalType?: FitnessGoalType;
  fitnessGoalIntensity?: FitnessGoalIntensity;
  // Weight for calculation
  currentWeight?: number;
}

// -----------------------------------------------------------------------------
// Re-export analytics types
// -----------------------------------------------------------------------------
export * from './analytics';

// =============================================================================
// Analytics Types
// =============================================================================

export type Period = '7d' | '30d' | '90d' | '1y' | 'all';
export type Aggregation = 'daily' | 'weekly' | 'monthly';
export type TrendDirection = 'INCREASING' | 'DECREASING' | 'STABLE';
export type AdherenceStatus = 'UNDER' | 'ON_TARGET' | 'OVER';

// -----------------------------------------------------------------------------
// Weight Trend Types
// -----------------------------------------------------------------------------

export interface WeightDataPoint {
  date: string;
  weight: number;
}

export interface TrendLinePoint {
  date: string;
  value: number;
}

export interface WeightStatistics {
  startWeight: number;
  endWeight: number;
  minWeight: number;
  maxWeight: number;
  averageWeight: number;
  totalChange: number;
  changePercent: number;
  weeklyAvgChange: number;
  trend: TrendDirection;
  ratePerWeek: number;
}

export interface WeightTrendResponse {
  period: Period;
  startDate: string;
  endDate: string;
  dataPoints: WeightDataPoint[];
  trendLine: TrendLinePoint[];
  statistics: WeightStatistics;
}

// -----------------------------------------------------------------------------
// Body Composition Types
// -----------------------------------------------------------------------------

export interface BodyCompositionDataPoint {
  date: string;
  weight: number;
  bodyFatPercentage: number | null;
  bodyFatKg: number | null;
  muscleMassPercentage: number | null;
  muscleMassKg: number | null;
}

export interface MetricStatistics {
  start: number;
  end: number;
  change: number;
  changePercent: number;
}

export interface BodyCompositionStatistics {
  weight: MetricStatistics;
  bodyFat: MetricStatistics;
  muscleMass: MetricStatistics;
}

export interface BodyCompositionTrendResponse {
  period: Period;
  startDate: string;
  endDate: string;
  dataPoints: BodyCompositionDataPoint[];
  statistics: BodyCompositionStatistics;
}

// -----------------------------------------------------------------------------
// Calorie Intake Types
// -----------------------------------------------------------------------------

export interface CalorieDataPoint {
  date: string;
  consumed: number;
  goal: number;
  difference: number;
  adherence: AdherenceStatus;
  workoutCalories: number;
  netCalories: number;
}

export interface CalorieStatistics {
  averageIntake: number;
  averageGoal: number;
  daysOnTarget: number;
  daysUnder: number;
  daysOver: number;
  adherenceRate: number;
  totalDeficit: number;
  averageDeficit: number;
  totalWorkoutCalories: number;
}

export interface CalorieIntakeTrendResponse {
  period: Period;
  startDate: string;
  endDate: string;
  dailyGoal: number;
  dataPoints: CalorieDataPoint[];
  statistics: CalorieStatistics;
}

// -----------------------------------------------------------------------------
// Macro Distribution Types
// -----------------------------------------------------------------------------

export interface MacroDetail {
  grams: number;
  calories: number;
  percent: number;
}

export interface MacroDistribution {
  protein: MacroDetail;
  carbs: MacroDetail;
  fat: MacroDetail;
}

export interface DailyMacroBreakdown {
  date: string;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroDistributionResponse {
  date?: string;
  startDate?: string;
  endDate?: string;
  daysWithData?: number;
  distribution: MacroDistribution;
  averageDistribution?: MacroDistribution;
  total: {
    calories: number;
    grams: number;
  };
  targets?: MacroDistribution;
  comparison?: {
    protein: { difference: number; percentOfTarget: number };
    carbs: { difference: number; percentOfTarget: number };
    fat: { difference: number; percentOfTarget: number };
  };
  dailyBreakdown?: DailyMacroBreakdown[];
}

// -----------------------------------------------------------------------------
// Dashboard Summary Types
// -----------------------------------------------------------------------------

export interface MacroProgressSummary {
  protein: { consumed: number; goal: number; percent: number };
  carbs: { consumed: number; goal: number; percent: number };
  fat: { consumed: number; goal: number; percent: number };
}

export interface TodaySummary {
  date: string;
  caloriesConsumed: number;
  calorieGoal: number;
  caloriesRemaining: number;
  progressPercent: number;
  macros: MacroProgressSummary;
  workouts: number;
  workoutCalories: number;
}

export interface WeekSummary {
  averageCalories: number;
  adherenceRate: number;
  workouts: number;
  cheatMeals: number;
}

export interface ProgressSummary {
  currentWeight: number | null;
  startWeight: number | null;
  goalWeight: number | null;
  weightLost: number | null;
  percentToGoal: number | null;
  weeklyRate: number | null;
}

export interface StreaksSummary {
  currentLoggingStreak: number;
  longestLoggingStreak: number;
  currentWorkoutStreak: number;
}

export interface DashboardSummaryResponse {
  today: TodaySummary;
  week: WeekSummary;
  progress: ProgressSummary;
  streaks: StreaksSummary;
}

// -----------------------------------------------------------------------------
// Workout Summary Types
// -----------------------------------------------------------------------------

export interface WorkoutTypeDistribution {
  type: string;
  count: number;
  percent: number;
}

export interface WorkoutCaloriesByType {
  type: string;
  calories: number;
}

export interface WorkoutWeekTrend {
  week: string;
  workouts: number;
  duration: number;
  calories: number;
}

export interface WorkoutConsistency {
  daysWithWorkouts: number;
  totalDays: number;
  consistencyPercent: number;
}

export interface WorkoutSummaryResponse {
  period: Period;
  startDate: string;
  endDate: string;
  summary: {
    totalWorkouts: number;
    totalDurationMinutes: number;
    totalCaloriesBurned: number;
    averageWorkoutsPerWeek: number;
    averageDurationMinutes: number;
    averageCaloriesPerWorkout: number;
    consistency: WorkoutConsistency;
  };
  byType: {
    distribution: WorkoutTypeDistribution[];
    caloriesByType: WorkoutCaloriesByType[];
  };
  trend: WorkoutWeekTrend[];
  comparison?: {
    previousPeriod: { workouts: number; calories: number };
    change: {
      workouts: number;
      workoutsPercent: number;
      calories: number;
      caloriesPercent: number;
    };
  };
}

// -----------------------------------------------------------------------------
// Body Metrics Extended Types
// -----------------------------------------------------------------------------

export interface BodyMetricsListResponse {
  content: BodyMetricsEntry[];
  page: PageInfo;
  summary: BodyMetricsSummary;
}

export interface BodyMetricsEntry {
  id: string;
  date: string;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  bodyFatKg: number | null;
  muscleMassPercentage: number | null;
  muscleMassKg: number | null;
  hasPhotos: boolean;
  photoCount: number;
}

export interface PageInfo {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface BodyMetricsSummary {
  latestWeight: number | null;
  oldestWeight: number | null;
  weightChange: number | null;
  latestBodyFat: number | null;
  oldestBodyFat: number | null;
  bodyFatChange: number | null;
}

export interface MetricTrendData {
  start: number | null;
  end: number | null;
  min: number | null;
  max: number | null;
  average: number | null;
  change: number | null;
  changePercent: number | null;
  trend: TrendDirection;
}

export interface BodyMetricsTrendsResponse {
  period: Period;
  startDate: string;
  endDate: string;
  dataPoints: number;
  weight: MetricTrendData;
  bodyFat: MetricTrendData;
  muscleMass: MetricTrendData;
}

export interface ProgressPhotoTimeline {
  date: string;
  metricsId: string;
  position: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';
  imageUrl: string;
  weightKg: number | null;
}

export interface PhotoTimelineResponse {
  photos: ProgressPhotoTimeline[];
}

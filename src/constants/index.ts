import type {
  ActivityLevel,
  FitnessGoalType,
  FitnessGoalIntensity,
  ActivityLevelOption,
  FitnessGoalOption,
} from '../types';

// Password validation regex
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation messages
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  passwordMin: 'Password must be at least 8 characters',
  passwordUppercase: 'Password must contain at least one uppercase letter',
  passwordLowercase: 'Password must contain at least one lowercase letter',
  passwordNumber: 'Password must contain at least one number',
  passwordMatch: 'Passwords do not match',
  nameMin: 'Name must be at least 2 characters',
};

// Password requirements for UI display
export const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', check: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', check: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', check: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', check: (p: string) => /\d/.test(p) },
];

// Activity level data with descriptions
export const ACTIVITY_LEVEL_DATA: Record<
  ActivityLevel,
  { label: string; description: string; multiplier: number }
> = {
  SEDENTARY: {
    label: 'Sedentary',
    description: 'Little to no exercise',
    multiplier: 1.2,
  },
  LIGHT: {
    label: 'Light exercise',
    description: '1-2 times per week',
    multiplier: 1.375,
  },
  MODERATE: {
    label: 'Moderate exercise',
    description: '3-5 times per week',
    multiplier: 1.55,
  },
  HARD: {
    label: 'Hard exercise',
    description: '6-7 times per week',
    multiplier: 1.725,
  },
  VERY_HARD: {
    label: 'Very hard exercise',
    description: 'Physical job or athlete',
    multiplier: 1.9,
  },
  ATHLETE: {
    label: 'Professional athlete',
    description: 'Intense training daily',
    multiplier: 2.4,
  },
};

// Fitness goal data
export const FITNESS_GOAL_DATA: Record<
  FitnessGoalType,
  { label: string; description: string; icon: string }
> = {
  LOSE: {
    label: 'Lose Weight',
    description: 'Create a calorie deficit to lose fat',
    icon: 'trending-down',
  },
  MAINTAIN: {
    label: 'Maintain Weight',
    description: 'Keep your current weight stable',
    icon: 'remove',
  },
  GAIN: {
    label: 'Gain Weight',
    description: 'Build muscle with a calorie surplus',
    icon: 'trending-up',
  },
};

// Intensity data for weight loss/gain
export const INTENSITY_DATA: Record<
  FitnessGoalIntensity,
  { label: string; weeklyChange: string; dailyAdjustment: number }
> = {
  SLOW: {
    label: 'Slow',
    weeklyChange: '~0.25 kg/week',
    dailyAdjustment: 250,
  },
  NORMAL: {
    label: 'Normal',
    weeklyChange: '~0.5 kg/week',
    dailyAdjustment: 500,
  },
  HARD: {
    label: 'Fast',
    weeklyChange: '~0.75 kg/week',
    dailyAdjustment: 750,
  },
  EXTREME: {
    label: 'Extreme',
    weeklyChange: '~1 kg/week',
    dailyAdjustment: 1000,
  },
};

// Activity level options for forms
export const ACTIVITY_LEVEL_OPTIONS: ActivityLevelOption[] = [
  { level: 'SEDENTARY', multiplier: 1.2, description: 'Little or no exercise' },
  { level: 'LIGHT', multiplier: 1.375, description: 'Light exercise 1-2 days/week' },
  { level: 'MODERATE', multiplier: 1.55, description: 'Moderate exercise 3-5 days/week' },
  { level: 'HARD', multiplier: 1.725, description: 'Hard exercise 6-7 days/week' },
  { level: 'VERY_HARD', multiplier: 1.9, description: 'Very hard exercise or physical job' },
];

// Default values
export const DEFAULT_ACTIVITY_LEVEL: ActivityLevel = 'MODERATE';
export const DEFAULT_FITNESS_GOAL: FitnessGoalType = 'MAINTAIN';
export const DEFAULT_INTENSITY: FitnessGoalIntensity = 'NORMAL';

// Height and weight ranges
export const HEIGHT_MIN_CM = 50;
export const HEIGHT_MAX_CM = 300;
export const WEIGHT_MIN_KG = 20;
export const WEIGHT_MAX_KG = 500;
export const AGE_MIN = 13;
export const AGE_MAX = 120;

// Unit conversions
export const CM_TO_INCHES = 0.393701;
export const INCHES_TO_CM = 2.54;
export const KG_TO_LBS = 2.20462;
export const LBS_TO_KG = 0.453592;

// Calculate BMR using Mifflin-St Jeor Equation (for reference)
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'MALE' | 'FEMALE'
): number {
  if (sex === 'MALE') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

// Calculate TDEE
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_LEVEL_DATA[activityLevel].multiplier);
}

// Calculate daily calorie goal
export function calculateDailyGoal(
  tdee: number,
  goalType: FitnessGoalType,
  intensity?: FitnessGoalIntensity
): number {
  if (goalType === 'MAINTAIN') {
    return tdee;
  }
  const adjustment = intensity ? INTENSITY_DATA[intensity].dailyAdjustment : 500;
  return goalType === 'LOSE' ? tdee - adjustment : tdee + adjustment;
}

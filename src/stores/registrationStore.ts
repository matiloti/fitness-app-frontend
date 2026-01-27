import { create } from 'zustand';
import type { RegistrationData, Sex, ActivityLevel, FitnessGoalType, FitnessGoalIntensity } from '../types';

interface RegistrationState {
  data: RegistrationData;
  currentStep: number;

  // Step 1: Account
  setAccountData: (email: string, password: string, name: string) => void;

  // Step 2: Profile
  setProfileData: (dateOfBirth: string, sex: Sex) => void;

  // Step 3: Metrics
  setMetricsData: (heightCm: number, currentWeight: number) => void;

  // Step 4: Goals
  setGoalsData: (activityLevel: ActivityLevel, fitnessGoalType: FitnessGoalType, fitnessGoalIntensity?: FitnessGoalIntensity) => void;

  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Reset
  reset: () => void;
}

const initialData: RegistrationData = {
  email: '',
  password: '',
  name: '',
};

export const useRegistrationStore = create<RegistrationState>((set) => ({
  data: initialData,
  currentStep: 0,

  setAccountData: (email, password, name) => {
    set((state) => ({
      data: { ...state.data, email, password, name },
    }));
  },

  setProfileData: (dateOfBirth, sex) => {
    set((state) => ({
      data: { ...state.data, dateOfBirth, sex },
    }));
  },

  setMetricsData: (heightCm, currentWeight) => {
    set((state) => ({
      data: { ...state.data, heightCm, currentWeight },
    }));
  },

  setGoalsData: (activityLevel, fitnessGoalType, fitnessGoalIntensity) => {
    set((state) => ({
      data: { ...state.data, activityLevel, fitnessGoalType, fitnessGoalIntensity },
    }));
  },

  nextStep: () => {
    set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) }));
  },

  prevStep: () => {
    set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) }));
  },

  goToStep: (step) => {
    set({ currentStep: Math.max(0, Math.min(step, 3)) });
  },

  reset: () => {
    set({ data: initialData, currentStep: 0 });
  },
}));

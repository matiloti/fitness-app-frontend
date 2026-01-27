import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, StepIndicator, RadioGroup } from '../../../src/components/ui';
import { useRegistrationStore } from '../../../src/stores/registrationStore';
import { useAuth } from '../../../src/hooks/useAuth';
import {
  ACTIVITY_LEVEL_DATA,
  FITNESS_GOAL_DATA,
  INTENSITY_DATA,
  calculateBMR,
  calculateTDEE,
  calculateDailyGoal,
} from '../../../src/constants';
import type { ActivityLevel, FitnessGoalType, FitnessGoalIntensity, ApiError } from '../../../src/types';
import type { AxiosError } from 'axios';

const STEPS = ['Account', 'Profile', 'Metrics', 'Goals'];

export default function RegisterStep4Screen() {
  const router = useRouter();
  const { data, setGoalsData, reset } = useRegistrationStore();
  const { register, isRegistering } = useAuth();

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(data.activityLevel || 'MODERATE');
  const [goalType, setGoalType] = useState<FitnessGoalType>(data.fitnessGoalType || 'MAINTAIN');
  const [intensity, setIntensity] = useState<FitnessGoalIntensity | null>(
    data.fitnessGoalIntensity || 'NORMAL'
  );

  // Calculate estimated calories
  const bmr = data.currentWeight && data.heightCm && data.dateOfBirth && data.sex
    ? calculateBMR(
        data.currentWeight,
        data.heightCm,
        new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear(),
        data.sex
      )
    : 1800;

  const tdee = calculateTDEE(bmr, activityLevel);
  const dailyGoal = calculateDailyGoal(tdee, goalType, goalType !== 'MAINTAIN' ? intensity || 'NORMAL' : undefined);

  const activityLevelOptions = Object.entries(ACTIVITY_LEVEL_DATA).map(([key, value]) => ({
    value: key as ActivityLevel,
    label: value.label,
    description: value.description,
    sublabel: `~${Math.round(bmr * value.multiplier).toLocaleString()} kcal/day`,
  }));

  const goalTypeOptions = Object.entries(FITNESS_GOAL_DATA).map(([key, value]) => ({
    value: key as FitnessGoalType,
    label: value.label,
    description: value.description,
  }));

  const intensityOptions = Object.entries(INTENSITY_DATA).map(([key, value]) => ({
    value: key as FitnessGoalIntensity,
    label: value.label,
    description: value.weeklyChange,
    sublabel: `${goalType === 'LOSE' ? '-' : '+'}${value.dailyAdjustment} kcal/day`,
  }));

  const handleBack = () => {
    router.back();
  };

  const handleCreateAccount = async () => {
    setGoalsData(activityLevel, goalType, goalType !== 'MAINTAIN' ? intensity || 'NORMAL' : undefined);

    try {
      await register({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      // Reset registration state
      reset();

      // Navigation to main app is handled by root layout
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorCode = axiosError.response?.data?.error?.code;
      const errorMessage = axiosError.response?.data?.error?.message;

      if (errorCode === 'EMAIL_ALREADY_EXISTS') {
        Alert.alert('Email Already Registered', 'An account with this email already exists. Please sign in or use a different email.');
      } else if (errorCode === 'VALIDATION_ERROR') {
        Alert.alert('Validation Error', errorMessage || 'Please check your information and try again.');
      } else {
        Alert.alert('Error', errorMessage || 'Something went wrong. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center px-4 py-2">
            <TouchableOpacity onPress={handleBack} accessibilityLabel="Go back" accessibilityRole="button">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Step Indicator */}
          <StepIndicator steps={STEPS} currentStep={3} />

          <View className="flex-1 px-6 pt-4">
            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 mb-2" accessibilityRole="header">
              Your Fitness Goal
            </Text>
            <Text className="text-base text-gray-500 mb-4">
              What do you want to achieve?
            </Text>

            {/* Activity Level */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-600 mb-2">Activity Level</Text>
              <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                <RadioGroup
                  options={activityLevelOptions}
                  value={activityLevel}
                  onChange={setActivityLevel}
                  label="Activity level selection"
                />
              </View>
            </View>

            {/* Goal Type */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-600 mb-2">Goal</Text>
              <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                <RadioGroup
                  options={goalTypeOptions}
                  value={goalType}
                  onChange={(value) => {
                    setGoalType(value);
                    if (value === 'MAINTAIN') {
                      setIntensity(null);
                    } else if (!intensity) {
                      setIntensity('NORMAL');
                    }
                  }}
                  label="Goal type selection"
                />
              </View>
            </View>

            {/* Intensity (only for lose/gain) */}
            {goalType !== 'MAINTAIN' && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  {goalType === 'LOSE' ? 'Weight Loss' : 'Weight Gain'} Pace
                </Text>
                <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                  <RadioGroup
                    options={intensityOptions}
                    value={intensity}
                    onChange={setIntensity}
                    label="Intensity selection"
                  />
                </View>
              </View>
            )}

            {/* Calorie Goal Preview */}
            <View className="bg-blue-50 rounded-xl p-4 mb-6">
              <Text className="text-sm text-blue-600 text-center mb-1">
                Your daily calorie goal
              </Text>
              <Text className="text-3xl font-bold text-blue-600 text-center">
                {dailyGoal.toLocaleString()} kcal/day
              </Text>
              {goalType !== 'MAINTAIN' && (
                <Text className="text-xs text-blue-500 text-center mt-1">
                  TDEE ({tdee.toLocaleString()}) {goalType === 'LOSE' ? '-' : '+'}{' '}
                  {INTENSITY_DATA[intensity || 'NORMAL'].dailyAdjustment} = {dailyGoal.toLocaleString()}
                </Text>
              )}
            </View>

            {/* Create Account Button */}
            <Button
              title="Create Account"
              variant="primary"
              size="lg"
              fullWidth
              loading={isRegistering}
              onPress={handleCreateAccount}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

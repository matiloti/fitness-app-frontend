import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RadioGroup } from '../../../src/components/ui';
import { useProfile } from '../../../src/hooks/useProfile';
import { FITNESS_GOAL_DATA, INTENSITY_DATA, calculateDailyGoal } from '../../../src/constants';
import type { FitnessGoalType, FitnessGoalIntensity } from '../../../src/types';

export default function FitnessGoalScreen() {
  const router = useRouter();
  const { profile, updateFitnessGoal, isUpdatingFitnessGoal } = useProfile();

  const [goalType, setGoalType] = useState<FitnessGoalType>(
    profile?.fitnessGoal?.type || 'MAINTAIN'
  );
  const [intensity, setIntensity] = useState<FitnessGoalIntensity | null>(
    profile?.fitnessGoal?.intensity || 'NORMAL'
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile?.fitnessGoal) {
      setGoalType(profile.fitnessGoal.type);
      setIntensity(profile.fitnessGoal.intensity);
    }
  }, [profile]);

  useEffect(() => {
    const typeChanged = goalType !== profile?.fitnessGoal?.type;
    const intensityChanged = goalType !== 'MAINTAIN' && intensity !== profile?.fitnessGoal?.intensity;
    setHasChanges(typeChanged || intensityChanged);
  }, [goalType, intensity, profile]);

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

  const handleSave = async () => {
    try {
      await updateFitnessGoal({
        type: goalType,
        intensity: goalType !== 'MAINTAIN' ? intensity : null,
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update fitness goal. Please try again.');
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  // Calculate estimated daily goal
  const tdee = profile?.calculations?.tdee || 2000;
  const dailyGoal = calculateDailyGoal(tdee, goalType, goalType !== 'MAINTAIN' ? intensity || 'NORMAL' : undefined);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={handleBack} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Fitness Goal</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || isUpdatingFitnessGoal}
          accessibilityLabel="Save changes"
          accessibilityRole="button"
        >
          <Text className={`text-base font-semibold ${hasChanges && !isUpdatingFitnessGoal ? 'text-blue-500' : 'text-gray-400'}`}>
            {isUpdatingFitnessGoal ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-sm text-gray-500 mb-4">What's your goal?</Text>

          {/* Goal Type */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-600 mb-2">Goal Type</Text>
            <View className="bg-white rounded-xl overflow-hidden shadow-sm">
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
              <View className="bg-white rounded-xl overflow-hidden shadow-sm">
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
          <View className="bg-blue-50 rounded-xl p-4 mt-2">
            <Text className="text-sm text-blue-600 text-center mb-1">
              Your Daily Calorie Goal
            </Text>
            <Text className="text-3xl font-bold text-blue-600 text-center">
              {dailyGoal.toLocaleString()} kcal/day
            </Text>
            {goalType !== 'MAINTAIN' && intensity && (
              <Text className="text-xs text-blue-500 text-center mt-1">
                TDEE ({tdee.toLocaleString()}) {goalType === 'LOSE' ? '-' : '+'}{' '}
                {INTENSITY_DATA[intensity].dailyAdjustment} = {dailyGoal.toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

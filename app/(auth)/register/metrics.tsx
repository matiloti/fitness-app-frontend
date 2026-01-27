import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Button, StepIndicator, SegmentedControl, Input } from '../../../src/components/ui';
import { useRegistrationStore } from '../../../src/stores/registrationStore';
import {
  HEIGHT_MIN_CM,
  HEIGHT_MAX_CM,
  WEIGHT_MIN_KG,
  WEIGHT_MAX_KG,
  CM_TO_INCHES,
  INCHES_TO_CM,
  KG_TO_LBS,
  LBS_TO_KG,
} from '../../../src/constants';

const STEPS = ['Account', 'Profile', 'Metrics', 'Goals'];

type HeightUnit = 'cm' | 'ft';
type WeightUnit = 'kg' | 'lbs';

export default function RegisterStep3Screen() {
  const router = useRouter();
  const { data, setMetricsData } = useRegistrationStore();

  const [heightCm, setHeightCm] = useState(data.heightCm || 170);
  const [weightKg, setWeightKg] = useState(data.currentWeight || 70);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [errors, setErrors] = useState<{ height?: string; weight?: string }>({});

  const formatHeight = (cm: number, unit: HeightUnit): string => {
    if (unit === 'cm') {
      return `${Math.round(cm)} cm`;
    } else {
      const totalInches = cm * CM_TO_INCHES;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}'${inches}"`;
    }
  };

  const formatWeight = (kg: number, unit: WeightUnit): string => {
    if (unit === 'kg') {
      return `${kg.toFixed(1)} kg`;
    } else {
      return `${(kg * KG_TO_LBS).toFixed(1)} lbs`;
    }
  };

  const validate = (): boolean => {
    const newErrors: { height?: string; weight?: string } = {};

    if (heightCm < HEIGHT_MIN_CM || heightCm > HEIGHT_MAX_CM) {
      newErrors.height = `Height must be between ${HEIGHT_MIN_CM} and ${HEIGHT_MAX_CM} cm`;
    }

    if (weightKg < WEIGHT_MIN_KG || weightKg > WEIGHT_MAX_KG) {
      newErrors.weight = `Weight must be between ${WEIGHT_MIN_KG} and ${WEIGHT_MAX_KG} kg`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    setMetricsData(Math.round(heightCm), Math.round(weightKg * 10) / 10);
    router.push('/(auth)/register/goals');
  };

  const handleBack = () => {
    router.back();
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
          <StepIndicator steps={STEPS} currentStep={2} />

          <View className="flex-1 px-6 pt-4">
            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 mb-2" accessibilityRole="header">
              Your Metrics
            </Text>
            <Text className="text-base text-gray-500 mb-6">
              This helps us calculate your personalized calorie goals
            </Text>

            {/* Form */}
            <View>
              {/* Height */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm font-medium text-gray-600">Height</Text>
                  <SegmentedControl
                    options={[
                      { value: 'cm' as HeightUnit, label: 'cm' },
                      { value: 'ft' as HeightUnit, label: 'ft/in' },
                    ]}
                    value={heightUnit}
                    onChange={setHeightUnit}
                    style={{ width: 120 }}
                  />
                </View>

                <View className="bg-gray-50 rounded-lg p-4">
                  <Text className="text-3xl font-bold text-center text-gray-900 mb-4">
                    {formatHeight(heightCm, heightUnit)}
                  </Text>
                  <Slider
                    value={heightCm}
                    onValueChange={setHeightCm}
                    minimumValue={HEIGHT_MIN_CM}
                    maximumValue={HEIGHT_MAX_CM}
                    step={1}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor="#3B82F6"
                    accessibilityLabel={`Height: ${formatHeight(heightCm, heightUnit)}`}
                  />
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-gray-400">{formatHeight(HEIGHT_MIN_CM, heightUnit)}</Text>
                    <Text className="text-xs text-gray-400">{formatHeight(HEIGHT_MAX_CM, heightUnit)}</Text>
                  </View>
                </View>
                {errors.height && <Text className="text-xs text-red-500 mt-1">{errors.height}</Text>}
              </View>

              {/* Weight */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm font-medium text-gray-600">Current Weight</Text>
                  <SegmentedControl
                    options={[
                      { value: 'kg' as WeightUnit, label: 'kg' },
                      { value: 'lbs' as WeightUnit, label: 'lbs' },
                    ]}
                    value={weightUnit}
                    onChange={setWeightUnit}
                    style={{ width: 120 }}
                  />
                </View>

                <View className="bg-gray-50 rounded-lg p-4">
                  <Text className="text-3xl font-bold text-center text-gray-900 mb-4">
                    {formatWeight(weightKg, weightUnit)}
                  </Text>
                  <Slider
                    value={weightKg}
                    onValueChange={setWeightKg}
                    minimumValue={WEIGHT_MIN_KG}
                    maximumValue={WEIGHT_MAX_KG}
                    step={0.1}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor="#3B82F6"
                    accessibilityLabel={`Weight: ${formatWeight(weightKg, weightUnit)}`}
                  />
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-gray-400">{formatWeight(WEIGHT_MIN_KG, weightUnit)}</Text>
                    <Text className="text-xs text-gray-400">{formatWeight(WEIGHT_MAX_KG, weightUnit)}</Text>
                  </View>
                </View>
                {errors.weight && <Text className="text-xs text-red-500 mt-1">{errors.weight}</Text>}
              </View>

              {/* Continue Button */}
              <Button
                title="Continue"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleContinue}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

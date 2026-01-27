import { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { SegmentedControl, SettingsRow } from '../../../src/components/ui';
import { useProfile } from '../../../src/hooks/useProfile';
import { HEIGHT_MIN_CM, HEIGHT_MAX_CM, CM_TO_INCHES } from '../../../src/constants';
import type { Sex } from '../../../src/types';

type HeightUnit = 'cm' | 'ft';

export default function EditMetricsScreen() {
  const router = useRouter();
  const { profile, updateMetrics, isUpdatingMetrics } = useProfile();

  const [dateOfBirth, setDateOfBirth] = useState<Date>(
    profile?.metrics?.dateOfBirth ? new Date(profile.metrics.dateOfBirth) : new Date(1995, 0, 1)
  );
  const [sex, setSex] = useState<Sex | null>(profile?.metrics?.sex || null);
  const [heightCm, setHeightCm] = useState(profile?.metrics?.heightCm || 170);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ dateOfBirth?: string; sex?: string; height?: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile?.metrics) {
      if (profile.metrics.dateOfBirth) {
        setDateOfBirth(new Date(profile.metrics.dateOfBirth));
      }
      if (profile.metrics.sex) {
        setSex(profile.metrics.sex);
      }
      if (profile.metrics.heightCm) {
        setHeightCm(profile.metrics.heightCm);
      }
    }
  }, [profile]);

  useEffect(() => {
    const original = profile?.metrics;
    const dobChanged = original?.dateOfBirth !== dateOfBirth.toISOString().split('T')[0];
    const sexChanged = original?.sex !== sex;
    const heightChanged = original?.heightCm !== Math.round(heightCm);
    setHasChanges(dobChanged || sexChanged || heightChanged);
  }, [dateOfBirth, sex, heightCm, profile]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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

  const validate = (): boolean => {
    const newErrors: { dateOfBirth?: string; sex?: string; height?: string } = {};

    const age = calculateAge(dateOfBirth);
    if (age < 13) {
      newErrors.dateOfBirth = 'You must be at least 13 years old';
    } else if (age > 120) {
      newErrors.dateOfBirth = 'Please enter a valid date of birth';
    }

    if (!sex) {
      newErrors.sex = 'Please select your biological sex';
    }

    if (heightCm < HEIGHT_MIN_CM || heightCm > HEIGHT_MAX_CM) {
      newErrors.height = `Height must be between ${HEIGHT_MIN_CM} and ${HEIGHT_MAX_CM} cm`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!sex) return;

    try {
      await updateMetrics({
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        sex,
        heightCm: Math.round(heightCm),
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update metrics. Please try again.');
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

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13);

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={handleBack} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">Personal Info</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges || isUpdatingMetrics}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
          >
            <Text className={`text-base font-semibold ${hasChanges && !isUpdatingMetrics ? 'text-blue-500' : 'text-gray-400'}`}>
              {isUpdatingMetrics ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-4">
            <Text className="text-sm text-gray-500 mb-4">
              This information is used to calculate your calorie goals
            </Text>

            {/* Date of Birth */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-600 mb-2">Date of Birth</Text>
              <TouchableOpacity
                className={`flex-row items-center justify-between p-4 rounded-xl bg-white ${
                  errors.dateOfBirth ? 'border-2 border-red-500' : ''
                }`}
                onPress={() => setShowDatePicker(true)}
              >
                <View>
                  <Text className="text-base text-gray-900">{formatDate(dateOfBirth)}</Text>
                  <Text className="text-sm text-gray-500">{calculateAge(dateOfBirth)} years old</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              {errors.dateOfBirth && (
                <Text className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</Text>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display="spinner"
                onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDateOfBirth(selectedDate);
                  }
                }}
                maximumDate={maxDate}
                minimumDate={minDate}
              />
            )}

            {/* Biological Sex */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-600 mb-2">Biological Sex</Text>
              <SegmentedControl
                options={[
                  { value: 'MALE' as Sex, label: 'Male' },
                  { value: 'FEMALE' as Sex, label: 'Female' },
                ]}
                value={sex || ('' as Sex)}
                onChange={(value) => setSex(value)}
              />
              {errors.sex && <Text className="text-xs text-red-500 mt-1">{errors.sex}</Text>}
            </View>

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

              <View className="bg-white rounded-xl p-4">
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
                />
                <View className="flex-row justify-between mt-2">
                  <Text className="text-xs text-gray-400">{formatHeight(HEIGHT_MIN_CM, heightUnit)}</Text>
                  <Text className="text-xs text-gray-400">{formatHeight(HEIGHT_MAX_CM, heightUnit)}</Text>
                </View>
              </View>
              {errors.height && <Text className="text-xs text-red-500 mt-1">{errors.height}</Text>}
            </View>

            <Text className="text-xs text-gray-400 text-center mb-6">
              Your BMR will be recalculated based on these metrics
            </Text>

            {/* Weight Section - Link to Body Metrics */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-600 mb-2">Weight</Text>
              <View className="rounded-xl overflow-hidden">
                <SettingsRow
                  title="Log Body Metrics"
                  subtitle="Track your weight, body fat, and progress photos"
                  icon="scale-outline"
                  iconColor="#3B82F6"
                  onPress={() => {
                    // Navigate to body metrics screen (to be implemented in Phase 2)
                    Alert.alert(
                      'Coming Soon',
                      'Body metrics tracking will be available in a future update. Your weight and body composition can be logged there.',
                      [{ text: 'OK' }]
                    );
                  }}
                  isFirst
                  isLast
                />
              </View>
              <Text className="text-xs text-gray-400 mt-2 text-center">
                Weight changes over time and is tracked separately in Body Metrics
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

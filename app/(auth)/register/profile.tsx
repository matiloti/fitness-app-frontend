import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button, StepIndicator, SegmentedControl } from '../../../src/components/ui';
import { useRegistrationStore } from '../../../src/stores/registrationStore';
import type { Sex } from '../../../src/types';

const STEPS = ['Account', 'Profile', 'Metrics', 'Goals'];

export default function RegisterStep2Screen() {
  const router = useRouter();
  const { data, setProfileData } = useRegistrationStore();

  const [dateOfBirth, setDateOfBirth] = useState<Date>(
    data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(1995, 0, 1)
  );
  const [sex, setSex] = useState<Sex | null>(data.sex || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ dateOfBirth?: string; sex?: string }>({});

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

  const validate = (): boolean => {
    const newErrors: { dateOfBirth?: string; sex?: string } = {};

    const age = calculateAge(dateOfBirth);
    if (age < 13) {
      newErrors.dateOfBirth = 'You must be at least 13 years old';
    } else if (age > 120) {
      newErrors.dateOfBirth = 'Please enter a valid date of birth';
    }

    if (!sex) {
      newErrors.sex = 'Please select your biological sex';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    const formattedDate = dateOfBirth.toISOString().split('T')[0];
    setProfileData(formattedDate, sex!);
    router.push('/(auth)/register/metrics');
  };

  const handleBack = () => {
    router.back();
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13);

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);

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
          <StepIndicator steps={STEPS} currentStep={1} />

          <View className="flex-1 px-6 pt-4">
            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 mb-2" accessibilityRole="header">
              Your Profile
            </Text>
            <Text className="text-base text-gray-500 mb-6">
              This helps us personalize your experience
            </Text>

            {/* Form */}
            <View>
              {/* Date of Birth */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-600 mb-2">Date of Birth</Text>
                <TouchableOpacity
                  className={`flex-row items-center justify-between p-4 rounded-lg bg-gray-50 ${
                    errors.dateOfBirth ? 'border-2 border-red-500' : 'border border-gray-200'
                  }`}
                  onPress={() => setShowDatePicker(true)}
                  accessibilityLabel={`Date of birth: ${formatDate(dateOfBirth)}`}
                  accessibilityHint="Double tap to change"
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
                  textColor="#000000"
                  themeVariant="light"
                />
              )}

              {/* Biological Sex */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-600 mb-2">Biological Sex</Text>
                <Text className="text-xs text-gray-400 mb-3">
                  Used for accurate calorie calculations
                </Text>
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

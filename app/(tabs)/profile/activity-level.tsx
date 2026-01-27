import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RadioGroup } from '../../../src/components/ui';
import { useProfile } from '../../../src/hooks/useProfile';
import { ACTIVITY_LEVEL_DATA } from '../../../src/constants';
import type { ActivityLevel } from '../../../src/types';

export default function ActivityLevelScreen() {
  const router = useRouter();
  const { profile, updateActivityLevel, isUpdatingActivityLevel } = useProfile();

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile?.activityLevel?.level || 'MODERATE'
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile?.activityLevel) {
      setActivityLevel(profile.activityLevel.level);
    }
  }, [profile]);

  useEffect(() => {
    setHasChanges(activityLevel !== profile?.activityLevel?.level);
  }, [activityLevel, profile]);

  const activityLevelOptions = Object.entries(ACTIVITY_LEVEL_DATA).map(([key, value]) => ({
    value: key as ActivityLevel,
    label: value.label,
    description: value.description,
    sublabel: `Multiplier: ${value.multiplier}x`,
  }));

  const handleSave = async () => {
    try {
      await updateActivityLevel({ activityLevel });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update activity level. Please try again.');
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

  // Estimate TDEE based on activity level
  const bmr = profile?.calculations?.bmr || 1800;
  const estimatedTdee = Math.round(bmr * ACTIVITY_LEVEL_DATA[activityLevel].multiplier);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={handleBack} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Activity Level</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || isUpdatingActivityLevel}
          accessibilityLabel="Save changes"
          accessibilityRole="button"
        >
          <Text className={`text-base font-semibold ${hasChanges && !isUpdatingActivityLevel ? 'text-blue-500' : 'text-gray-400'}`}>
            {isUpdatingActivityLevel ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-sm text-gray-500 mb-4">
            How active are you on a typical week?
          </Text>

          <View className="bg-white rounded-xl overflow-hidden shadow-sm">
            <RadioGroup
              options={activityLevelOptions}
              value={activityLevel}
              onChange={setActivityLevel}
              label="Activity level selection"
            />
          </View>

          {/* TDEE Preview */}
          <View className="bg-blue-50 rounded-xl p-4 mt-6">
            <View className="flex-row items-center justify-center mb-2">
              <Ionicons name="calculator" size={20} color="#3B82F6" />
              <Text className="text-sm text-blue-600 ml-2">Your TDEE</Text>
            </View>
            <Text className="text-2xl font-bold text-blue-600 text-center">
              {estimatedTdee.toLocaleString()} kcal/day
            </Text>
            <Text className="text-xs text-blue-500 text-center mt-1">
              Total Daily Energy Expenditure
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

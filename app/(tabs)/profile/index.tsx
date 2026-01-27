import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, SettingsRow, Button } from '../../../src/components/ui';
import { useProfile } from '../../../src/hooks/useProfile';
import { useAuth } from '../../../src/hooks/useAuth';
import { ACTIVITY_LEVEL_DATA, FITNESS_GOAL_DATA, INTENSITY_DATA } from '../../../src/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { logout, isLoggingOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out?',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const formatActivityLevel = () => {
    if (!profile?.activityLevel) return 'Not set';
    return ACTIVITY_LEVEL_DATA[profile.activityLevel.level]?.label || profile.activityLevel.description;
  };

  const formatFitnessGoal = () => {
    if (!profile?.fitnessGoal) return 'Not set';
    const goal = FITNESS_GOAL_DATA[profile.fitnessGoal.type];
    if (profile.fitnessGoal.type === 'MAINTAIN') {
      return goal?.label || 'Maintain';
    }
    const intensity = profile.fitnessGoal.intensity
      ? INTENSITY_DATA[profile.fitnessGoal.intensity]?.label
      : '';
    return `${goal?.label || profile.fitnessGoal.type}${intensity ? ` - ${intensity}` : ''}`;
  };

  const formatMetrics = () => {
    if (!profile?.metrics) return 'Not set';
    const parts: string[] = [];
    if (profile.metrics.age) parts.push(`${profile.metrics.age}y`);
    if (profile.metrics.sex) parts.push(profile.metrics.sex === 'MALE' ? 'M' : 'F');
    if (profile.metrics.heightCm) parts.push(`${profile.metrics.heightCm}cm`);
    return parts.length > 0 ? parts.join(', ') : 'Not set';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 py-4">
          <Text className="text-2xl font-bold text-gray-900">Settings</Text>
        </View>

        {/* Profile Card */}
        <View className="mx-4 mb-6 bg-white rounded-xl p-6 items-center shadow-sm">
          <Avatar
            uri={profile?.photoUrl}
            name={profile?.name}
            size="lg"
            onPress={() => router.push('/(tabs)/profile/edit')}
            showEditBadge
          />
          <Text className="text-xl font-bold text-gray-900 mt-4">
            {profile?.name || 'User'}
          </Text>
          <Text className="text-base text-gray-500">{profile?.email || ''}</Text>
          <TouchableOpacity
            className="mt-3"
            onPress={() => router.push('/(tabs)/profile/edit')}
          >
            <Text className="text-blue-500 font-medium">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Goals Section */}
        <View className="px-4 mb-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">
            Goals
          </Text>
          <View className="bg-white rounded-xl overflow-hidden shadow-sm">
            <SettingsRow
              icon="flame"
              iconColor="#F97316"
              title="Daily Calories"
              value={
                profile?.calculations?.dailyCalorieGoal
                  ? `${profile.calculations.dailyCalorieGoal.toLocaleString()} kcal`
                  : 'Not calculated'
              }
              onPress={() => router.push('/(tabs)/profile/fitness-goal')}
              isFirst
            />
            <SettingsRow
              icon="flag"
              iconColor="#3B82F6"
              title="Fitness Goal"
              value={formatFitnessGoal()}
              onPress={() => router.push('/(tabs)/profile/fitness-goal')}
            />
            <SettingsRow
              icon="walk"
              iconColor="#22C55E"
              title="Activity Level"
              value={formatActivityLevel()}
              onPress={() => router.push('/(tabs)/profile/activity-level')}
              isLast
            />
          </View>
        </View>

        {/* Profile Section */}
        <View className="px-4 mb-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">
            Profile
          </Text>
          <View className="bg-white rounded-xl overflow-hidden shadow-sm">
            <SettingsRow
              icon="person"
              iconColor="#8B5CF6"
              title="Personal Info"
              value={formatMetrics()}
              onPress={() => router.push('/(tabs)/profile/metrics')}
              isFirst
            />
            <SettingsRow
              icon="location"
              iconColor="#EC4899"
              title="Country"
              value={profile?.country?.name || 'Not set'}
              onPress={() => router.push('/(tabs)/profile/edit')}
              isLast
            />
          </View>
        </View>

        {/* Account Section */}
        <View className="px-4 mb-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">
            Account
          </Text>
          <View className="bg-white rounded-xl overflow-hidden shadow-sm">
            <SettingsRow
              icon="mail"
              iconColor="#06B6D4"
              title="Email"
              value={profile?.email || ''}
              onPress={() => router.push('/(tabs)/profile/change-email')}
              isFirst
            />
            <SettingsRow
              icon="lock-closed"
              iconColor="#F59E0B"
              title="Password"
              value="********"
              onPress={() => router.push('/(tabs)/profile/change-password')}
              isLast
            />
          </View>
        </View>

        {/* About Section */}
        <View className="px-4 mb-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">
            About
          </Text>
          <View className="bg-white rounded-xl overflow-hidden shadow-sm">
            <SettingsRow
              icon="help-circle"
              iconColor="#6B7280"
              title="Help & Support"
              onPress={() => {}}
              isFirst
            />
            <SettingsRow
              icon="document-text"
              iconColor="#6B7280"
              title="Privacy Policy"
              onPress={() => {}}
            />
            <SettingsRow
              icon="document"
              iconColor="#6B7280"
              title="Terms of Service"
              onPress={() => {}}
            />
            <SettingsRow
              icon="information-circle"
              iconColor="#6B7280"
              title="Version"
              value="1.0.0"
              showChevron={false}
              isLast
            />
          </View>
        </View>

        {/* Sign Out */}
        <View className="px-4 mb-8">
          <TouchableOpacity
            className="bg-white rounded-xl py-4 items-center shadow-sm"
            onPress={handleLogout}
            disabled={isLoggingOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out of account"
          >
            <Text className="text-red-500 font-semibold text-base">
              {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

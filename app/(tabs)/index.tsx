import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';

export default function DashboardScreen() {
  const { profile } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Welcome{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}!
          </Text>
          <Text className="text-base text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Placeholder content */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-lg">Dashboard coming soon</Text>
          <Text className="text-gray-400 text-sm mt-2">
            Track your calories and macros here
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

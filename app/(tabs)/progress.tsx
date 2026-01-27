import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProgressScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400 text-lg">Progress coming soon</Text>
        <Text className="text-gray-400 text-sm mt-2">
          Track your body metrics and see analytics
        </Text>
      </View>
    </SafeAreaView>
  );
}

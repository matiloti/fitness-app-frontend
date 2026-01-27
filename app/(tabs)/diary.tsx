import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiaryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400 text-lg">Diary coming soon</Text>
        <Text className="text-gray-400 text-sm mt-2">
          Log your meals and track nutrition
        </Text>
      </View>
    </SafeAreaView>
  );
}

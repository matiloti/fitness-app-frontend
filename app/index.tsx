import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-primary-600 mb-4">
        FitTrack Pro
      </Text>
      <Text className="text-gray-600 mb-8">
        Your fitness journey starts here
      </Text>
      <Link
        href="/login"
        className="bg-primary-500 px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-semibold">Get Started</Text>
      </Link>
    </View>
  );
}

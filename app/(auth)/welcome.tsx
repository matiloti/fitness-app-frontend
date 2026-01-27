import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui';

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-8">
        {/* Logo */}
        <View className="w-20 h-20 rounded-2xl bg-blue-500 items-center justify-center mb-6">
          <Ionicons name="fitness" size={44} color="white" />
        </View>

        {/* App Name */}
        <Text
          className="text-3xl font-bold text-gray-900 mb-2"
          accessibilityRole="header"
        >
          FitTrack Pro
        </Text>

        {/* Tagline */}
        <Text className="text-lg text-gray-500 text-center mb-12">
          Track your fitness journey
        </Text>

        {/* Buttons */}
        <View className="w-full space-y-4">
          <Link href="/(auth)/register" asChild>
            <Button
              title="Get Started"
              variant="primary"
              size="lg"
              fullWidth
              accessibilityLabel="Get started, create a new account"
            />
          </Link>

          <View className="h-4" />

          <Link href="/(auth)/login" asChild>
            <Button
              title="I have an account"
              variant="secondary"
              size="lg"
              fullWidth
              accessibilityLabel="Sign in to existing account"
            />
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

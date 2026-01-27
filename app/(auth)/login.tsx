import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { EMAIL_REGEX } from '../../src/constants';
import type { AxiosError } from 'axios';
import type { ApiError } from '../../src/types';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await login({ email: email.trim().toLowerCase(), password });
      // Navigation is handled by the root layout
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorCode = axiosError.response?.data?.error?.code;
      const errorMessage = axiosError.response?.data?.error?.message;

      if (errorCode === 'INVALID_CREDENTIALS') {
        Alert.alert('Sign In Failed', 'Invalid email or password. Please try again.');
      } else {
        Alert.alert('Error', errorMessage || 'Something went wrong. Please try again.');
      }
    }
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
            <Link href="/(auth)/welcome" asChild>
              <Ionicons
                name="arrow-back"
                size={24}
                color="#374151"
                accessibilityLabel="Go back"
                accessibilityRole="button"
              />
            </Link>
          </View>

          <View className="flex-1 px-6 pt-8">
            {/* Title */}
            <Text className="text-3xl font-bold text-gray-900 mb-2" accessibilityRole="header">
              Welcome back
            </Text>
            <Text className="text-lg text-gray-500 mb-8">
              Sign in to continue your journey
            </Text>

            {/* Form */}
            <View>
              <Input
                label="Email"
                placeholder="email@example.com"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry
                showPasswordToggle
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              {/* Forgot Password */}
              <View className="items-end mb-6">
                <Link href="/(auth)/forgot-password">
                  <Text className="text-blue-500 text-sm font-medium">Forgot password?</Text>
                </Link>
              </View>

              {/* Sign In Button */}
              <Button
                title="Sign In"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoggingIn}
                onPress={handleLogin}
                accessibilityLabel="Sign in"
                accessibilityHint="Double tap to sign in to your account"
              />
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500">Don't have an account? </Text>
              <Link href="/(auth)/register">
                <Text className="text-blue-500 font-semibold">Sign Up</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

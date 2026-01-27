import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { PASSWORD_REQUIREMENTS } from '../../src/constants';
import type { AxiosError } from 'axios';
import type { ApiError } from '../../src/types';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { resetPassword, isResettingPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [success, setSuccess] = useState(false);

  const passwordChecks = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    passed: req.check(password),
  }));

  const allPasswordRequirementsMet = passwordChecks.every((check) => check.passed);

  const validate = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!allPasswordRequirementsMet) {
      newErrors.password = 'Password does not meet requirements';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!token) {
      Alert.alert('Invalid Link', 'This password reset link is invalid. Please request a new one.');
      return;
    }

    try {
      await resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorCode = axiosError.response?.data?.error?.code;
      const status = axiosError.response?.status;

      if (status === 410 || errorCode === 'TOKEN_EXPIRED') {
        Alert.alert(
          'Link Expired',
          'This password reset link has expired. Please request a new one.',
          [{ text: 'Request New Link', onPress: () => router.replace('/(auth)/forgot-password') }]
        );
      } else if (errorCode === 'TOKEN_INVALID') {
        Alert.alert(
          'Invalid Link',
          'This password reset link is invalid. Please request a new one.',
          [{ text: 'Request New Link', onPress: () => router.replace('/(auth)/forgot-password') }]
        );
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };

  const handleClose = () => {
    router.replace('/(auth)/login');
  };

  // Success state
  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-4 py-2 justify-end">
          <TouchableOpacity onPress={handleClose} accessibilityLabel="Close" accessibilityRole="button">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center" accessibilityRole="header">
            Password Reset
          </Text>

          <Text className="text-base text-gray-500 text-center mb-8">
            Your password has been reset successfully. You can now sign in with your new password.
          </Text>

          <Button
            title="Sign In"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

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
          <View className="flex-row items-center px-4 py-2 justify-end">
            <TouchableOpacity onPress={handleClose} accessibilityLabel="Close" accessibilityRole="button">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-6 pt-8">
            {/* Title */}
            <Text className="text-3xl font-bold text-gray-900 mb-2" accessibilityRole="header">
              Reset Password
            </Text>
            <Text className="text-lg text-gray-500 mb-8">Create a new password for your account</Text>

            {/* Form */}
            <View >
              <Input
                label="New Password"
                placeholder="Create a new password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry
                showPasswordToggle
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
              />

              {/* Password Requirements */}
              <View className="mb-4 -mt-2">
                <Text className="text-sm text-gray-600 mb-2">Password must contain:</Text>
                {passwordChecks.map((check) => (
                  <View key={check.id} className="flex-row items-center mb-1">
                    <Ionicons
                      name={check.passed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={check.passed ? '#22C55E' : '#9CA3AF'}
                    />
                    <Text
                      className={`ml-2 text-sm ${check.passed ? 'text-gray-700' : 'text-gray-400'}`}
                    >
                      {check.label}
                    </Text>
                  </View>
                ))}
              </View>

              <Input
                label="Confirm Password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={errors.confirmPassword}
                secureTextEntry
                showPasswordToggle
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <View className="mt-4">
                <Button
                  title="Reset Password"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isResettingPassword}
                  onPress={handleSubmit}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

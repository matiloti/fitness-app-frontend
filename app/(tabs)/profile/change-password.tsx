import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';
import { PASSWORD_REQUIREMENTS } from '../../../src/constants';
import type { AxiosError } from 'axios';
import type { ApiError } from '../../../src/types';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword, isChangingPassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const passwordChecks = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    passed: req.check(newPassword),
  }));

  const allPasswordRequirementsMet = passwordChecks.every((check) => check.passed);

  const validate = (): boolean => {
    const newErrors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!allPasswordRequirementsMet) {
      newErrors.newPassword = 'Password does not meet requirements';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert('Success', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorCode = axiosError.response?.data?.error?.code;

      if (errorCode === 'INVALID_CREDENTIALS' || axiosError.response?.status === 401) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else if (errorCode === 'PASSWORD_TOO_WEAK') {
        setErrors({ newPassword: 'Password does not meet requirements' });
      } else {
        Alert.alert('Error', 'Failed to change password. Please try again.');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const hasContent = currentPassword || newPassword || confirmPassword;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={handleBack} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">Change Password</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!hasContent || isChangingPassword}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
          >
            <Text className={`text-base font-semibold ${hasContent && !isChangingPassword ? 'text-blue-500' : 'text-gray-400'}`}>
              {isChangingPassword ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-4">
            <Input
              label="Current Password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              error={errors.currentPassword}
              secureTextEntry
              showPasswordToggle
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="next"
            />

            <Input
              label="New Password"
              placeholder="Enter your new password"
              value={newPassword}
              onChangeText={setNewPassword}
              error={errors.newPassword}
              secureTextEntry
              showPasswordToggle
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />

            {/* Password Requirements */}
            <View className="mb-4 -mt-2">
              <Text className="text-sm text-gray-600 mb-2">Password requirements:</Text>
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
              label="Confirm New Password"
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

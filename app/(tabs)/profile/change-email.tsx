import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../../src/components/ui';
import { useAuth } from '../../../src/hooks/useAuth';
import { useProfile } from '../../../src/hooks/useProfile';
import { EMAIL_REGEX } from '../../../src/constants';
import type { AxiosError } from 'axios';
import type { ApiError } from '../../../src/types';

export default function ChangeEmailScreen() {
  const router = useRouter();
  const { changeEmail, isChangingEmail } = useAuth();
  const { profile } = useProfile();

  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ newEmail?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { newEmail?: string; password?: string } = {};

    if (!newEmail.trim()) {
      newErrors.newEmail = 'Email is required';
    } else if (!EMAIL_REGEX.test(newEmail)) {
      newErrors.newEmail = 'Please enter a valid email';
    } else if (newEmail.trim().toLowerCase() === profile?.email?.toLowerCase()) {
      newErrors.newEmail = 'New email must be different from current email';
    }

    if (!password) {
      newErrors.password = 'Password is required for verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await changeEmail({
        newEmail: newEmail.trim().toLowerCase(),
        password,
      });
      Alert.alert(
        'Email Updated',
        `Your email has been changed to ${newEmail.trim().toLowerCase()}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorCode = axiosError.response?.data?.error?.code;

      if (errorCode === 'INVALID_CREDENTIALS' || axiosError.response?.status === 401) {
        setErrors({ password: 'Password is incorrect' });
      } else if (errorCode === 'EMAIL_ALREADY_EXISTS') {
        setErrors({ newEmail: 'This email is already registered' });
      } else if (errorCode === 'VALIDATION_ERROR') {
        setErrors({ newEmail: 'Please enter a valid email address' });
      } else {
        Alert.alert('Error', 'Failed to change email. Please try again.');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const hasContent = newEmail || password;

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
          <Text className="text-lg font-semibold text-gray-900">Change Email</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!hasContent || isChangingEmail}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
          >
            <Text className={`text-base font-semibold ${hasContent && !isChangingEmail ? 'text-blue-500' : 'text-gray-400'}`}>
              {isChangingEmail ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-4">
            {/* Current Email (read-only) */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-600 mb-2">Current Email</Text>
              <View className="p-4 rounded-xl bg-gray-100">
                <Text className="text-base text-gray-500">{profile?.email || ''}</Text>
              </View>
            </View>

            <Input
              label="New Email"
              placeholder="Enter your new email"
              value={newEmail}
              onChangeText={setNewEmail}
              error={errors.newEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <Input
              label="Current Password"
              placeholder="Enter your password to confirm"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              showPasswordToggle
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <Text className="text-xs text-gray-400 mt-2">
              We'll update your email immediately. Make sure you have access to the new email address.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

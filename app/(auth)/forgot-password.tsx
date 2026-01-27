import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { EMAIL_REGEX } from '../../src/constants';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, isSendingResetEmail, resetEmailSent } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      setSubmitted(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      setSubmitted(true);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Success state
  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-4 py-2">
          <TouchableOpacity onPress={handleBack} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center" accessibilityRole="header">
            Check your email
          </Text>

          <Text className="text-base text-gray-500 text-center mb-8">
            We sent a password reset link to{'\n'}
            <Text className="font-semibold text-gray-700">{email}</Text>
          </Text>

          <Text className="text-sm text-gray-400 text-center mb-6">
            Didn't receive it? Check your spam folder or request a new link.
          </Text>

          <Button
            title="Back to Sign In"
            variant="secondary"
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
          <View className="flex-row items-center px-4 py-2">
            <TouchableOpacity onPress={handleBack} accessibilityLabel="Go back" accessibilityRole="button">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-6 pt-8">
            {/* Title */}
            <Text className="text-3xl font-bold text-gray-900 mb-2" accessibilityRole="header">
              Forgot Password?
            </Text>
            <Text className="text-lg text-gray-500 mb-8">
              Enter your email and we'll send you a link to reset your password
            </Text>

            {/* Form */}
            <View >
              <Input
                label="Email"
                placeholder="email@example.com"
                value={email}
                onChangeText={setEmail}
                error={error}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <View className="mt-4">
                <Button
                  title="Send Reset Link"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isSendingResetEmail}
                  onPress={handleSubmit}
                />
              </View>
            </View>

            {/* Sign In Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500">Remember your password? </Text>
              <Link href="/(auth)/login">
                <Text className="text-blue-500 font-semibold">Sign In</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

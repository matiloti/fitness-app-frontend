import { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, StepIndicator } from '../../../src/components/ui';
import { useRegistrationStore } from '../../../src/stores/registrationStore';
import { EMAIL_REGEX, PASSWORD_REQUIREMENTS } from '../../../src/constants';

const STEPS = ['Account', 'Profile', 'Metrics', 'Goals'];

export default function RegisterStep1Screen() {
  const router = useRouter();
  const { data, setAccountData, reset } = useRegistrationStore();

  const [name, setName] = useState(data.name || '');
  const [email, setEmail] = useState(data.email || '');
  const [password, setPassword] = useState(data.password || '');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // Reset registration data on mount if coming fresh
  useEffect(() => {
    if (!data.email) {
      reset();
    }
  }, []);

  const passwordChecks = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    passed: req.check(password),
  }));

  const allPasswordRequirementsMet = passwordChecks.every((check) => check.passed);

  const validate = (): boolean => {
    const newErrors: { name?: string; email?: string; password?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!allPasswordRequirementsMet) {
      newErrors.password = 'Password does not meet requirements';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    setAccountData(email.trim().toLowerCase(), password, name.trim());
    router.push('/(auth)/register/profile');
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

          {/* Step Indicator */}
          <StepIndicator steps={STEPS} currentStep={0} />

          <View className="flex-1 px-6 pt-4">
            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 mb-2" accessibilityRole="header">
              Create Account
            </Text>
            <Text className="text-base text-gray-500 mb-6">
              Let's start with your basic info
            </Text>

            {/* Form */}
            <View >
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                error={errors.name}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />

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
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry
                showPasswordToggle
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
              />

              {/* Password Requirements */}
              <View className="mb-6">
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

              {/* Continue Button */}
              <Button
                title="Continue"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleContinue}
              />
            </View>

            {/* Sign In Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500">Already have an account? </Text>
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

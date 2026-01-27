import { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, Input, Button } from '../../../src/components/ui';
import { useProfile } from '../../../src/hooks/useProfile';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, uploadPhoto, deletePhoto, isUpdatingProfile, isUploadingPhoto } = useProfile();

  const [name, setName] = useState(profile?.name || '');
  const [photoUri, setPhotoUri] = useState<string | null>(profile?.photoUrl || null);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhotoUri(profile.photoUrl);
    }
  }, [profile]);

  useEffect(() => {
    const changed = name !== profile?.name || photoUri !== profile?.photoUrl;
    setHasChanges(changed);
  }, [name, photoUri, profile]);

  const validate = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take a profile photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickImage },
        ...(profile?.photoUrl
          ? [
              {
                text: 'Remove Photo',
                style: 'destructive' as const,
                onPress: () => setPhotoUri(null),
              },
            ]
          : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      // Update photo if changed
      if (photoUri !== profile?.photoUrl) {
        if (photoUri && photoUri !== profile?.photoUrl) {
          // Upload new photo - only if it's a local file (not already a URL)
          if (!photoUri.startsWith('http')) {
            try {
              await uploadPhoto(photoUri);
            } catch (photoError) {
              console.error('Failed to upload photo:', photoError);
              Alert.alert('Photo Upload Failed', 'Could not upload the profile photo. Please try again.');
              return;
            }
          }
        } else if (!photoUri && profile?.photoUrl) {
          // Delete photo
          try {
            await deletePhoto();
          } catch (deleteError) {
            console.error('Failed to delete photo:', deleteError);
            Alert.alert('Error', 'Could not remove the profile photo. Please try again.');
            return;
          }
        }
      }

      // Update profile name if changed
      if (name !== profile?.name) {
        await updateProfile({ name: name.trim() });
      }

      router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const isLoading = isUpdatingProfile || isUploadingPhoto;

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
          <Text className="text-lg font-semibold text-gray-900">Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges || isLoading}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
          >
            <Text className={`text-base font-semibold ${hasChanges && !isLoading ? 'text-blue-500' : 'text-gray-400'}`}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View className="items-center py-8">
            <Avatar
              uri={photoUri}
              name={name}
              size="xl"
              onPress={handlePhotoOptions}
              showEditBadge
            />
            <TouchableOpacity className="mt-3" onPress={handlePhotoOptions}>
              <Text className="text-blue-500 font-medium">Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="px-4">
            <Input
              label="Full Name"
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

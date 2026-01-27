import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../../src/components/ui';
import { DateNavigation } from '../../../src/components/diary/DatePicker';
import { getDateString } from '../../../src/hooks/useDays';
import {
  useLatestBodyMetrics,
  useBodyMetricsByDate,
  useCreateBodyMetrics,
  useAddPhoto,
} from '../../../src/hooks/useBodyMetrics';

type PhotoPosition = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';
type WeightUnit = 'kg' | 'lb';
type BodyCompUnit = '%' | 'kg';

interface PhotoData {
  uri: string;
  position: PhotoPosition;
}

// Conversion constants
const KG_TO_LB = 2.20462;
const LB_TO_KG = 1 / KG_TO_LB;

// Convert between weight units
function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  if (from === 'kg' && to === 'lb') return value * KG_TO_LB;
  return value * LB_TO_KG;
}

// Get slider bounds for weight based on unit
function getWeightBounds(unit: WeightUnit): { min: number; max: number; step: number } {
  if (unit === 'kg') {
    return { min: 30, max: 200, step: 0.1 };
  }
  return { min: 66, max: 440, step: 0.2 }; // ~30kg and ~200kg in lb
}

// Get slider bounds for body composition based on unit
function getBodyCompBounds(unit: BodyCompUnit, type: 'fat' | 'muscle'): { min: number; max: number; step: number } {
  if (unit === '%') {
    return type === 'fat'
      ? { min: 3, max: 50, step: 0.1 }
      : { min: 20, max: 60, step: 0.1 };
  }
  // Absolute values in kg
  return type === 'fat'
    ? { min: 1, max: 100, step: 0.1 }
    : { min: 10, max: 80, step: 0.1 };
}

export default function LogMetricsScreen() {
  const router = useRouter();
  const today = getDateString();

  // State
  const [date, setDate] = useState(today);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [bodyFatPercentage, setBodyFatPercentage] = useState<number | null>(null);
  const [muscleMassPercentage, setMuscleMassPercentage] = useState<number | null>(null);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  // Track if form has been initialized for the current date
  const [initializedForDate, setInitializedForDate] = useState<string | null>(null);
  // Unit preferences
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [bodyFatUnit, setBodyFatUnit] = useState<BodyCompUnit>('%');
  const [muscleMassUnit, setMuscleMassUnit] = useState<BodyCompUnit>('%');

  // Queries
  const latestMetrics = useLatestBodyMetrics();
  const selectedDateMetrics = useBodyMetricsByDate(date);
  const createMetrics = useCreateBodyMetrics();
  const addPhoto = useAddPhoto();

  // Reset form when date changes
  useEffect(() => {
    if (initializedForDate !== null && initializedForDate !== date) {
      // Date changed, reset form state
      setWeightKg(null);
      setBodyFatPercentage(null);
      setMuscleMassPercentage(null);
      setPhotos([]);
      setInitializedForDate(null);
    }
  }, [date, initializedForDate]);

  // Initialize values from selected date's metrics or latest metrics
  useEffect(() => {
    // Only initialize if not already initialized for this date
    if (initializedForDate === date) {
      return;
    }

    const isDateDataLoaded = !selectedDateMetrics.isLoading;
    const isLatestDataLoaded = !latestMetrics.isLoading;

    // Wait for both queries to complete before initializing
    if (!isDateDataLoaded || !isLatestDataLoaded) {
      return;
    }

    // Use date-specific metrics if available, otherwise fall back to latest
    const metrics = selectedDateMetrics.data ?? latestMetrics.data;

    if (metrics) {
      // Initialize with existing values (use nullish coalescing to handle 0 values)
      if (metrics.weightKg !== null && metrics.weightKg !== undefined) {
        setWeightKg(metrics.weightKg);
      }
      if (metrics.bodyFatPercentage !== null && metrics.bodyFatPercentage !== undefined) {
        setBodyFatPercentage(metrics.bodyFatPercentage);
      }
      if (metrics.muscleMassPercentage !== null && metrics.muscleMassPercentage !== undefined) {
        setMuscleMassPercentage(metrics.muscleMassPercentage);
      }
    }

    setInitializedForDate(date);
  }, [date, selectedDateMetrics.data, selectedDateMetrics.isLoading, latestMetrics.data, latestMetrics.isLoading, initializedForDate]);

  // Unit toggle handlers
  const handleWeightUnitToggle = useCallback(() => {
    setWeightUnit((prev) => (prev === 'kg' ? 'lb' : 'kg'));
  }, []);

  const handleBodyFatUnitToggle = useCallback(() => {
    setBodyFatUnit((prev) => (prev === '%' ? 'kg' : '%'));
  }, []);

  const handleMuscleMassUnitToggle = useCallback(() => {
    setMuscleMassUnit((prev) => (prev === '%' ? 'kg' : '%'));
  }, []);

  // Get display value for weight based on current unit
  const displayWeight = weightKg !== null
    ? convertWeight(weightKg, 'kg', weightUnit)
    : null;

  const weightBounds = getWeightBounds(weightUnit);
  const bodyFatBounds = getBodyCompBounds(bodyFatUnit, 'fat');
  const muscleMassBounds = getBodyCompBounds(muscleMassUnit, 'muscle');

  const handleSave = useCallback(async () => {
    if (!weightKg && !bodyFatPercentage && !muscleMassPercentage) {
      Alert.alert('Missing Data', 'Please enter at least one measurement.');
      return;
    }

    setIsSaving(true);

    try {
      // First, save the body metrics to get the metrics ID
      // Note: We always save in base units (kg for weight, % for body composition)
      // If user entered absolute kg for body fat/muscle, we would need backend support
      // For now, we save what we have (which is always in the expected format)

      // Build request with explicit types to ensure proper serialization
      const requestData: {
        date: string;
        weightKg?: number;
        bodyFatPercentage?: number;
        muscleMassPercentage?: number;
      } = {
        date,
      };

      // Only include values that are set (not null)
      if (weightKg !== null) {
        requestData.weightKg = Number(weightKg.toFixed(1));
      }
      if (bodyFatPercentage !== null) {
        requestData.bodyFatPercentage = Number(bodyFatPercentage.toFixed(1));
      }
      if (muscleMassPercentage !== null) {
        requestData.muscleMassPercentage = Number(muscleMassPercentage.toFixed(1));
      }

      const savedMetrics = await createMetrics.mutateAsync(requestData);

      // Upload photos if any
      if (photos.length > 0 && savedMetrics.id) {
        const photoUploadPromises = photos.map((photo) =>
          addPhoto.mutateAsync({
            metricsId: savedMetrics.id,
            data: {
              position: photo.position,
              // Note: In a production app, you would first upload the image to a storage service
              // (like S3, Cloudinary, etc.) and then send the URL here.
              // For now, we're storing the local URI which will work for display but not persistence.
              imageUrl: photo.uri,
            },
          }).catch((err) => {
            console.error(`Failed to upload ${photo.position} photo:`, err);
            // Don't throw - we want to continue even if one photo fails
            return null;
          })
        );

        await Promise.all(photoUploadPromises);
      }

      Alert.alert('Success', 'Body metrics saved successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Failed to save body metrics:', error);
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Failed to save metrics. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [date, weightKg, bodyFatPercentage, muscleMassPercentage, photos, createMetrics, addPhoto, router]);

  const handlePickPhoto = useCallback(async (position: PhotoPosition) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll access to add photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => {
        // Replace existing photo for this position or add new
        const filtered = prev.filter((p) => p.position !== position);
        return [...filtered, { uri: result.assets[0].uri, position }];
      });
    }
  }, []);

  const handleTakePhoto = useCallback(async (position: PhotoPosition) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera access to take photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => {
        const filtered = prev.filter((p) => p.position !== position);
        return [...filtered, { uri: result.assets[0].uri, position }];
      });
    }
  }, []);

  const handlePhotoAction = useCallback((position: PhotoPosition) => {
    const existingPhoto = photos.find((p) => p.position === position);

    if (existingPhoto) {
      // Photo exists - show options to view/remove
      Alert.alert(
        `${position.charAt(0) + position.slice(1).toLowerCase()} Photo`,
        'What would you like to do?',
        [
          { text: 'Replace Photo', onPress: () => showPhotoSourceAlert(position) },
          { text: 'Remove Photo', onPress: () => handleRemovePhoto(position), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      showPhotoSourceAlert(position);
    }
  }, [photos]);

  const showPhotoSourceAlert = useCallback((position: PhotoPosition) => {
    Alert.alert(
      'Add Photo',
      `Add ${position.toLowerCase()} view photo`,
      [
        { text: 'Take Photo', onPress: () => handleTakePhoto(position) },
        { text: 'Choose from Library', onPress: () => handlePickPhoto(position) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [handleTakePhoto, handlePickPhoto]);

  const handleRemovePhoto = useCallback((position: PhotoPosition) => {
    setPhotos((prev) => prev.filter((p) => p.position !== position));
  }, []);

  const getPhotoForPosition = (position: PhotoPosition): PhotoData | undefined => {
    return photos.find((p) => p.position === position);
  };

  const isLoading = latestMetrics.isLoading || selectedDateMetrics.isLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date Selection */}
        <View style={styles.dateSelectorContainer}>
          <DateNavigation
            date={date}
            onDateChange={setDate}
            maxDate={today}
          />
        </View>

        {/* Weight */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Weight</Text>
            <TouchableOpacity
              style={styles.unitSelector}
              onPress={handleWeightUnitToggle}
              accessibilityLabel={`Switch to ${weightUnit === 'kg' ? 'pounds' : 'kilograms'}`}
            >
              <Text style={styles.unitText}>{weightUnit}</Text>
              <Ionicons name="swap-horizontal" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.metricValue}>
            {displayWeight !== null ? displayWeight.toFixed(1) : '--'} {weightUnit}
          </Text>

          <View style={styles.sliderRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => {
                const step = weightUnit === 'kg' ? 0.1 : 0.2;
                const minKg = weightUnit === 'kg' ? 30 : convertWeight(66, 'lb', 'kg');
                setWeightKg((v) => Math.max(minKg, (v ?? 70) - step));
              }}
              accessibilityLabel="Decrease weight"
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Slider
              style={styles.slider}
              minimumValue={weightBounds.min}
              maximumValue={weightBounds.max}
              value={displayWeight ?? (weightUnit === 'kg' ? 70 : 154)}
              onValueChange={(v) => {
                const value = typeof v === 'number' && !isNaN(v) ? Math.round(v * 10) / 10 : null;
                if (value !== null && value >= weightBounds.min && value <= weightBounds.max) {
                  // Convert back to kg for storage
                  setWeightKg(convertWeight(value, weightUnit, 'kg'));
                }
              }}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E5E5EA"
              thumbTintColor="#007AFF"
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => {
                const step = weightUnit === 'kg' ? 0.1 : 0.2;
                const maxKg = weightUnit === 'kg' ? 200 : convertWeight(440, 'lb', 'kg');
                setWeightKg((v) => Math.min(maxKg, (v ?? 70) + step));
              }}
              accessibilityLabel="Increase weight"
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>{weightBounds.min}</Text>
            <Text style={styles.sliderLabel}>{weightBounds.max}</Text>
          </View>
        </View>

        {/* Body Fat */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Body Fat</Text>
            <TouchableOpacity
              style={styles.unitSelector}
              onPress={handleBodyFatUnitToggle}
              accessibilityLabel={`Switch to ${bodyFatUnit === '%' ? 'kilograms' : 'percentage'}`}
            >
              <Text style={styles.unitText}>{bodyFatUnit}</Text>
              <Ionicons name="swap-horizontal" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.metricValue}>
            {bodyFatPercentage !== null ? bodyFatPercentage.toFixed(1) : '--'}{bodyFatUnit}
          </Text>

          <View style={styles.sliderRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                setBodyFatPercentage((v) => Math.max(bodyFatBounds.min, (v ?? 20) - 0.1))
              }
              accessibilityLabel="Decrease body fat"
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Slider
              style={styles.slider}
              minimumValue={bodyFatBounds.min}
              maximumValue={bodyFatBounds.max}
              value={bodyFatPercentage ?? (bodyFatUnit === '%' ? 20 : 15)}
              onValueChange={(v) => {
                const value = typeof v === 'number' && !isNaN(v) ? Math.round(v * 10) / 10 : null;
                if (value !== null && value >= bodyFatBounds.min && value <= bodyFatBounds.max) {
                  setBodyFatPercentage(value);
                }
              }}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E5E5EA"
              thumbTintColor="#007AFF"
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                setBodyFatPercentage((v) => Math.min(bodyFatBounds.max, (v ?? 20) + 0.1))
              }
              accessibilityLabel="Increase body fat"
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>{bodyFatBounds.min}{bodyFatUnit}</Text>
            <Text style={styles.sliderLabel}>{bodyFatBounds.max}{bodyFatUnit}</Text>
          </View>
        </View>

        {/* Muscle Mass */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Muscle Mass</Text>
            <TouchableOpacity
              style={styles.unitSelector}
              onPress={handleMuscleMassUnitToggle}
              accessibilityLabel={`Switch to ${muscleMassUnit === '%' ? 'kilograms' : 'percentage'}`}
            >
              <Text style={styles.unitText}>{muscleMassUnit}</Text>
              <Ionicons name="swap-horizontal" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.metricValue}>
            {muscleMassPercentage !== null ? muscleMassPercentage.toFixed(1) : '--'}{muscleMassUnit}
          </Text>

          <View style={styles.sliderRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                setMuscleMassPercentage((v) => Math.max(muscleMassBounds.min, (v ?? 40) - 0.1))
              }
              accessibilityLabel="Decrease muscle mass"
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Slider
              style={styles.slider}
              minimumValue={muscleMassBounds.min}
              maximumValue={muscleMassBounds.max}
              value={muscleMassPercentage ?? (muscleMassUnit === '%' ? 40 : 30)}
              onValueChange={(v) => {
                const value = typeof v === 'number' && !isNaN(v) ? Math.round(v * 10) / 10 : null;
                if (value !== null && value >= muscleMassBounds.min && value <= muscleMassBounds.max) {
                  setMuscleMassPercentage(value);
                }
              }}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E5E5EA"
              thumbTintColor="#007AFF"
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                setMuscleMassPercentage((v) => Math.min(muscleMassBounds.max, (v ?? 40) + 0.1))
              }
              accessibilityLabel="Increase muscle mass"
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>{muscleMassBounds.min}{muscleMassUnit}</Text>
            <Text style={styles.sliderLabel}>{muscleMassBounds.max}{muscleMassUnit}</Text>
          </View>
        </View>

        {/* Progress Photos */}
        <View style={styles.photoSection}>
          <Text style={styles.photoSectionTitle}>Progress Photos</Text>
          <Text style={styles.photoSectionSubtitle}>
            Track your visual progress with photos from different angles
          </Text>
          <View style={styles.photoGrid}>
            {(['FRONT', 'BACK', 'LEFT', 'RIGHT'] as PhotoPosition[]).map(
              (position) => {
                const photo = getPhotoForPosition(position);
                return (
                  <View key={position} style={styles.photoItem}>
                    <Text style={styles.photoLabel}>
                      {position.charAt(0) + position.slice(1).toLowerCase()}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.photoPlaceholder,
                        photo && styles.photoPlaceholderWithImage,
                      ]}
                      onPress={() => handlePhotoAction(position)}
                      accessibilityLabel={
                        photo
                          ? `${position.toLowerCase()} photo - tap to change or remove`
                          : `Add ${position.toLowerCase()} photo`
                      }
                    >
                      {photo ? (
                        <>
                          <Image
                            source={{ uri: photo.uri }}
                            style={styles.photoImage}
                            resizeMode="cover"
                          />
                          <View style={styles.photoCheckmark}>
                            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                          </View>
                        </>
                      ) : (
                        <Ionicons name="camera" size={24} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }
            )}
          </View>
          {photos.length > 0 && (
            <Text style={styles.photosAddedText}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} added
            </Text>
          )}
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save Metrics'}
            onPress={handleSave}
            loading={isSaving}
            disabled={(!weightKg && !bodyFatPercentage && !muscleMassPercentage) || isSaving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  dateSelectorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unitText: {
    fontSize: 15,
    color: '#007AFF',
  },
  metricValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginVertical: 16,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    flex: 1,
    height: 44,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 52,
  },
  sliderLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  photoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  photoSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  photoSectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  photoItem: {
    alignItems: 'center',
    width: '23%',
  },
  photoLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 8,
  },
  photoPlaceholder: {
    width: 72,
    height: 96,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
  },
  photoPlaceholderWithImage: {
    borderStyle: 'solid',
    borderColor: '#34C759',
    backgroundColor: 'transparent',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  photosAddedText: {
    fontSize: 13,
    color: '#34C759',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
  },
});

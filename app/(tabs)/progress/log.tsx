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

interface PhotoData {
  uri: string;
  position: PhotoPosition;
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

  // Queries
  const latestMetrics = useLatestBodyMetrics();
  const selectedDateMetrics = useBodyMetricsByDate(date);
  const createMetrics = useCreateBodyMetrics();
  const addPhoto = useAddPhoto();

  // Initialize values from selected date's metrics or latest metrics
  useEffect(() => {
    const metrics = selectedDateMetrics.data ?? latestMetrics.data;
    if (metrics) {
      if (weightKg === null && metrics.weightKg) {
        setWeightKg(metrics.weightKg);
      }
      if (bodyFatPercentage === null && metrics.bodyFatPercentage) {
        setBodyFatPercentage(metrics.bodyFatPercentage);
      }
      if (muscleMassPercentage === null && metrics.muscleMassPercentage) {
        setMuscleMassPercentage(metrics.muscleMassPercentage);
      }
    }
  }, [selectedDateMetrics.data, latestMetrics.data]);

  const handleSave = useCallback(async () => {
    if (!weightKg && !bodyFatPercentage && !muscleMassPercentage) {
      Alert.alert('Missing Data', 'Please enter at least one measurement.');
      return;
    }

    setIsSaving(true);

    try {
      // First, save the body metrics to get the metrics ID
      const savedMetrics = await createMetrics.mutateAsync({
        date,
        weightKg: weightKg ?? undefined,
        bodyFatPercentage: bodyFatPercentage ?? undefined,
        muscleMassPercentage: muscleMassPercentage ?? undefined,
      });

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
    } catch (error) {
      Alert.alert('Error', 'Failed to save metrics. Please try again.');
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
            <TouchableOpacity style={styles.unitSelector}>
              <Text style={styles.unitText}>kg</Text>
              <Ionicons name="chevron-down" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.metricValue}>
            {weightKg !== null ? weightKg.toFixed(1) : '--'} kg
          </Text>

          <View style={styles.sliderRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setWeightKg((v) => Math.max(30, (v ?? 70) - 0.1))}
              accessibilityLabel="Decrease weight"
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Slider
              style={styles.slider}
              minimumValue={30}
              maximumValue={200}
              value={weightKg ?? 70}
              onValueChange={(v) => setWeightKg(Math.round(v * 10) / 10)}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E5E5EA"
              thumbTintColor="#007AFF"
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setWeightKg((v) => Math.min(200, (v ?? 70) + 0.1))}
              accessibilityLabel="Increase weight"
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>30</Text>
            <Text style={styles.sliderLabel}>200</Text>
          </View>
        </View>

        {/* Body Fat */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Body Fat</Text>
            <TouchableOpacity style={styles.unitSelector}>
              <Text style={styles.unitText}>%</Text>
              <Ionicons name="chevron-down" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.metricValue}>
            {bodyFatPercentage !== null ? bodyFatPercentage.toFixed(1) : '--'}%
          </Text>

          <View style={styles.sliderRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                setBodyFatPercentage((v) => Math.max(3, (v ?? 20) - 0.1))
              }
              accessibilityLabel="Decrease body fat"
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Slider
              style={styles.slider}
              minimumValue={3}
              maximumValue={50}
              value={bodyFatPercentage ?? 20}
              onValueChange={(v) => setBodyFatPercentage(Math.round(v * 10) / 10)}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E5E5EA"
              thumbTintColor="#007AFF"
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                setBodyFatPercentage((v) => Math.min(50, (v ?? 20) + 0.1))
              }
              accessibilityLabel="Increase body fat"
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>3%</Text>
            <Text style={styles.sliderLabel}>50%</Text>
          </View>
        </View>

        {/* Muscle Mass */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Muscle Mass</Text>
            <TouchableOpacity style={styles.unitSelector}>
              <Text style={styles.unitText}>%</Text>
              <Ionicons name="chevron-down" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.metricValue}>
            {muscleMassPercentage !== null ? muscleMassPercentage.toFixed(1) : '--'}%
          </Text>

          <View style={styles.sliderRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                setMuscleMassPercentage((v) => Math.max(20, (v ?? 40) - 0.1))
              }
              accessibilityLabel="Decrease muscle mass"
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Slider
              style={styles.slider}
              minimumValue={20}
              maximumValue={60}
              value={muscleMassPercentage ?? 40}
              onValueChange={(v) =>
                setMuscleMassPercentage(Math.round(v * 10) / 10)
              }
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E5E5EA"
              thumbTintColor="#007AFF"
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                setMuscleMassPercentage((v) => Math.min(60, (v ?? 40) + 0.1))
              }
              accessibilityLabel="Increase muscle mass"
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>20%</Text>
            <Text style={styles.sliderLabel}>60%</Text>
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

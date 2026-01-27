import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutById, useUpdateWorkout, useCalorieEstimate } from '../../../src/hooks/useWorkouts';
import {
  WorkoutTypeGrid,
  DurationPicker,
  CalorieEstimate,
  WORKOUT_TYPE_CONFIG,
} from '../../../src/components/workouts';
import type { WorkoutType } from '../../../src/types';

export default function EditWorkoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: workout, isLoading: isLoadingWorkout } = useWorkoutById(id);
  const updateWorkout = useUpdateWorkout();

  // Form state
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [useActualCalories, setUseActualCalories] = useState(false);
  const [actualCalories, setActualCalories] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form with workout data
  useEffect(() => {
    if (workout && !isInitialized) {
      setSelectedType(workout.workoutType);
      setName(workout.name || '');
      setDuration(workout.durationMinutes);
      setNotes(workout.notes || '');

      if (workout.caloriesBurnedActual !== null) {
        setUseActualCalories(true);
        setActualCalories(workout.caloriesBurnedActual);
      } else {
        setUseActualCalories(false);
        setActualCalories(workout.caloriesBurnedEstimated);
      }
      setIsInitialized(true);
    }
  }, [workout, isInitialized]);

  // Calorie estimate query
  const {
    data: estimateData,
    isLoading: isEstimating,
  } = useCalorieEstimate(selectedType ?? undefined, duration);

  // Update estimated calories when workout type or duration changes
  useEffect(() => {
    if (estimateData?.estimatedCalories && !useActualCalories) {
      setActualCalories(Math.round(estimateData.estimatedCalories));
    }
  }, [estimateData?.estimatedCalories, useActualCalories]);

  const handleSubmit = useCallback(async () => {
    if (!id || !selectedType) {
      Alert.alert('Missing Information', 'Please select a workout type.');
      return;
    }

    if (duration < 1) {
      Alert.alert('Missing Information', 'Please enter a valid duration.');
      return;
    }

    try {
      await updateWorkout.mutateAsync({
        id,
        data: {
          workoutType: selectedType,
          name: name.trim() || undefined,
          durationMinutes: duration,
          caloriesBurnedActual: useActualCalories ? actualCalories : undefined,
          clearActualCalories: !useActualCalories && workout?.caloriesBurnedActual !== null,
          notes: notes.trim() || undefined,
        },
      });

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update workout. Please try again.');
    }
  }, [id, selectedType, duration, name, useActualCalories, actualCalories, notes, workout, updateWorkout, router]);

  const isValid = selectedType !== null && duration > 0;

  if (isLoadingWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'Edit Workout' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'Edit Workout' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Workout not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: 'Edit Workout',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Workout Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Type</Text>
            <WorkoutTypeGrid
              selectedType={selectedType}
              onSelect={setSelectedType}
            />
          </View>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Name (Optional)</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder={selectedType ? WORKOUT_TYPE_CONFIG[selectedType].label : 'e.g., Morning Run'}
                placeholderTextColor="#C7C7CC"
                maxLength={100}
                accessibilityLabel="Workout name"
              />
            </View>
          </View>

          {/* Duration Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <DurationPicker
              value={duration}
              onChange={setDuration}
            />
          </View>

          {/* Calorie Estimation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calories Burned</Text>
            <CalorieEstimate
              estimatedCalories={estimateData?.estimatedCalories ?? null}
              actualCalories={actualCalories}
              useActual={useActualCalories}
              onUseActualChange={setUseActualCalories}
              onActualChange={setActualCalories}
              isLoading={isEstimating}
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this workout..."
                placeholderTextColor="#C7C7CC"
                maxLength={1000}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="Workout notes"
              />
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isValid || updateWorkout.isPending) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValid || updateWorkout.isPending}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid || updateWorkout.isPending }}
          >
            {updateWorkout.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerButton: {
    marginLeft: 8,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 0,
  },
  footer: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

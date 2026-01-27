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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreateWorkout, useCalorieEstimate } from '../../../src/hooks/useWorkouts';
import {
  WorkoutTypeGrid,
  DurationPicker,
  CalorieEstimate,
  WORKOUT_TYPE_CONFIG,
} from '../../../src/components/workouts';
import type { WorkoutType } from '../../../src/types';

export default function LogWorkoutScreen() {
  const router = useRouter();
  const createWorkout = useCreateWorkout();

  // Form state
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState(30);
  const [useActualCalories, setUseActualCalories] = useState(false);
  const [actualCalories, setActualCalories] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  // Calorie estimate query
  const {
    data: estimateData,
    isLoading: isEstimating,
  } = useCalorieEstimate(selectedType ?? undefined, duration);

  // Reset actual calories when estimated changes
  useEffect(() => {
    if (estimateData?.estimatedCalories && !useActualCalories) {
      setActualCalories(Math.round(estimateData.estimatedCalories));
    }
  }, [estimateData?.estimatedCalories, useActualCalories]);

  const formatDate = (d: Date): string => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDateChange = useCallback((_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedType) {
      Alert.alert('Missing Information', 'Please select a workout type.');
      return;
    }

    if (duration < 1) {
      Alert.alert('Missing Information', 'Please enter a valid duration.');
      return;
    }

    try {
      await createWorkout.mutateAsync({
        date: date.toISOString().split('T')[0],
        workoutType: selectedType,
        name: name.trim() || undefined,
        durationMinutes: duration,
        caloriesBurnedActual: useActualCalories ? actualCalories : undefined,
        notes: notes.trim() || undefined,
      });

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to log workout. Please try again.');
    }
  }, [selectedType, duration, date, name, useActualCalories, actualCalories, notes, createWorkout, router]);

  const isValid = selectedType !== null && duration > 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setShowDatePicker(true)}
              accessibilityLabel={`Date: ${formatDate(date)}`}
              accessibilityRole="button"
            >
              <Ionicons name="calendar" size={20} color="#8E8E93" />
              <Text style={styles.inputValue}>{formatDate(date)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
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
              (!isValid || createWorkout.isPending) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValid || createWorkout.isPending}
            accessibilityLabel="Log workout"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid || createWorkout.isPending }}
          >
            {createWorkout.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Log Workout</Text>
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
  inputValue: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
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

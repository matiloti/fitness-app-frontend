import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutById, useDeleteWorkout } from '../../../src/hooks/useWorkouts';
import { WORKOUT_TYPE_CONFIG } from '../../../src/components/workouts';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: workout, isLoading, error } = useWorkoutById(id);
  const deleteWorkout = useDeleteWorkout();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Workout?',
      `This will remove "${workout?.name || WORKOUT_TYPE_CONFIG[workout?.workoutType || 'OTHER'].label}" from your history. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            setIsDeleting(true);
            try {
              await deleteWorkout.mutateAsync(id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workout. Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [id, workout, deleteWorkout, router]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'Workout' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'Workout' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Couldn't load workout</Text>
          <Text style={styles.errorSubtitle}>Please try again later</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const config = WORKOUT_TYPE_CONFIG[workout.workoutType];
  const displayName = workout.name || config.label;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: 'Workout',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {/* TODO: Navigate to edit screen */}}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View
            style={[styles.iconContainer, { backgroundColor: config.gradientStart }]}
          >
            <Ionicons name={config.icon} size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.workoutName}>{displayName}</Text>
          <Text style={styles.workoutType}>{config.label}</Text>
        </View>

        {/* Date/Time Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#8E8E93" />
            <Text style={styles.infoText}>{formatDate(workout.date)}</Text>
          </View>
          {workout.createdAt && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={16} color="#8E8E93" />
              <Text style={styles.infoText}>
                {new Date(workout.createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {formatDuration(workout.durationMinutes)}
            </Text>
            <Text style={styles.summaryLabel}>Duration</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {workout.caloriesBurned !== null
                ? `${Math.round(workout.caloriesBurned)}`
                : '--'}
            </Text>
            <Text style={styles.summaryLabel}>kcal Burned</Text>
          </View>
        </View>

        {/* Calorie Calculation Details */}
        {workout.calculationDetails && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Calorie Estimation</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Method</Text>
              <Text style={styles.detailValue}>
                {workout.caloriesBurnedActual !== null
                  ? 'Manual entry'
                  : 'Auto-calculated'}
              </Text>
            </View>
            {workout.caloriesBurnedActual === null && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>MET Value</Text>
                  <Text style={styles.detailValue}>
                    {workout.calculationDetails.metValue}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Weight Used</Text>
                  <Text style={styles.detailValue}>
                    {workout.calculationDetails.weightUsed} kg
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {workout.durationMinutes} min
                  </Text>
                </View>
              </>
            )}
            {workout.caloriesBurnedEstimated !== null &&
              workout.caloriesBurnedActual !== null && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estimated</Text>
                  <Text style={styles.detailValue}>
                    {Math.round(workout.caloriesBurnedEstimated)} kcal
                  </Text>
                </View>
              )}
          </View>
        )}

        {/* Notes */}
        {workout.notes && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Notes</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isDeleting}
          accessibilityLabel="Delete workout"
          accessibilityRole="button"
        >
          {isDeleting ? (
            <ActivityIndicator color="#FF3B30" />
          ) : (
            <>
              <Ionicons name="trash" size={16} color="#FF3B30" />
              <Text style={styles.deleteButtonText}>Delete Workout</Text>
            </>
          )}
        </TouchableOpacity>
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
  errorSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerButton: {
    marginRight: 8,
  },
  headerButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  workoutType: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 17,
    color: '#000000',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 12,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '500',
  },
});

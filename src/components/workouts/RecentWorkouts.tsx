import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutCard, WORKOUT_TYPE_CONFIG } from './WorkoutCard';
import type { WorkoutType } from '../../types';

interface WorkoutItem {
  id: string;
  date: string;
  workoutType: WorkoutType;
  name: string | null;
  durationMinutes: number;
  caloriesBurned: number | null;
}

interface RecentWorkoutsProps {
  workouts: WorkoutItem[];
  onHistoryPress?: () => void;
  onWorkoutPress?: (id: string) => void;
}

// Format relative date
const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = date.toISOString().split('T')[0];
  const todayOnly = today.toISOString().split('T')[0];
  const yesterdayOnly = yesterday.toISOString().split('T')[0];

  if (dateOnly === todayOnly) {
    return 'Today';
  }
  if (dateOnly === yesterdayOnly) {
    return 'Yesterday';
  }

  // Format as "Jan 25"
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function RecentWorkouts({
  workouts,
  onHistoryPress,
  onWorkoutPress,
}: RecentWorkoutsProps) {
  // Show only the most recent 3-5 workouts
  const recentWorkouts = workouts.slice(0, 5);

  if (recentWorkouts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Workouts</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={onHistoryPress}
          accessibilityLabel="View workout history"
          accessibilityRole="button"
        >
          <Text style={styles.historyText}>History</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.workoutsList}>
        {recentWorkouts.map((workout, index) => (
          <View key={workout.id}>
            <RecentWorkoutRow
              workout={workout}
              onPress={() => onWorkoutPress?.(workout.id)}
            />
            {index < recentWorkouts.length - 1 && (
              <View style={styles.separator} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

interface RecentWorkoutRowProps {
  workout: WorkoutItem;
  onPress?: () => void;
}

function RecentWorkoutRow({ workout, onPress }: RecentWorkoutRowProps) {
  const config = WORKOUT_TYPE_CONFIG[workout.workoutType];
  const displayName = workout.name || config.label;
  const relativeDate = formatRelativeDate(workout.date);

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  return (
    <TouchableOpacity
      style={styles.workoutRow}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${displayName}, ${config.label}, ${formatDuration(workout.durationMinutes)}, ${workout.caloriesBurned ?? 0} calories, ${relativeDate}`}
      accessibilityHint="Double tap to view workout details"
      accessibilityRole="button"
    >
      <View style={[styles.iconContainer, { backgroundColor: config.gradientStart }]}>
        <Ionicons name={config.icon} size={18} color="#FFFFFF" />
      </View>

      <View style={styles.content}>
        <Text style={styles.workoutName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.workoutDetails}>
          {formatDuration(workout.durationMinutes)}
          {workout.caloriesBurned !== null && ` \u2022 ${workout.caloriesBurned} kcal`}
        </Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{relativeDate}</Text>
        <Ionicons name="chevron-forward" size={14} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyText: {
    fontSize: 15,
    color: '#007AFF',
    marginRight: 2,
  },
  workoutsList: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 60,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  workoutName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  workoutDetails: {
    fontSize: 15,
    color: '#8E8E93',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  separator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 60, // Align with content after icon
  },
});

export default RecentWorkouts;

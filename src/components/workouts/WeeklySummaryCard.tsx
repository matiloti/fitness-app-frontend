import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WORKOUT_TYPE_CONFIG } from './WorkoutCard';
import type { WorkoutType } from '../../types';

interface WeeklyDay {
  date: string;
  dayOfWeek: string;
  hasWorkout: boolean;
  workoutType: WorkoutType | null;
  durationMinutes: number | null;
  caloriesBurned: number | null;
}

interface WeeklySummaryCardProps {
  days: WeeklyDay[];
  totalWorkouts: number;
  totalDurationMinutes: number;
  totalCaloriesBurned: number;
  onDayPress?: (date: string) => void;
  onPress?: () => void;
}

// Day label mapping
const DAY_LABELS: Record<string, string> = {
  'MONDAY': 'M',
  'TUESDAY': 'T',
  'WEDNESDAY': 'W',
  'THURSDAY': 'T',
  'FRIDAY': 'F',
  'SATURDAY': 'S',
  'SUNDAY': 'S',
};

export function WeeklySummaryCard({
  days,
  totalWorkouts,
  totalDurationMinutes,
  totalCaloriesBurned,
  onDayPress,
  onPress,
}: WeeklySummaryCardProps) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}min`;
  };

  // Determine if a day is today
  const isToday = (dateString: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  // Determine if a day is in the future
  const isFuture = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  // Get short workout type label
  const getWorkoutTypeLabel = (type: WorkoutType | null): string | null => {
    if (!type) return null;
    const config = WORKOUT_TYPE_CONFIG[type];
    // Return abbreviated label for space
    const label = config.label;
    if (label.length <= 4) return label;
    return label.substring(0, 4);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={`This week: ${totalWorkouts} workouts, ${formatDuration(totalDurationMinutes)} total duration, ${totalCaloriesBurned} calories burned`}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.calories}>{totalCaloriesBurned.toLocaleString()} kcal</Text>
      </View>

      <View style={styles.daysContainer}>
        {days.map((day) => {
          const today = isToday(day.date);
          const future = isFuture(day.date);
          const typeLabel = getWorkoutTypeLabel(day.workoutType);
          const dayLabel = DAY_LABELS[day.dayOfWeek] || day.dayOfWeek.charAt(0);

          return (
            <TouchableOpacity
              key={day.date}
              style={styles.dayWrapper}
              onPress={() => onDayPress?.(day.date)}
              accessibilityLabel={`${day.dayOfWeek}, ${day.hasWorkout ? 'workout logged' : 'no workout'}${today ? ', today' : ''}`}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.dayCircle,
                  day.hasWorkout && styles.dayCircleActive,
                  today && !day.hasWorkout && styles.dayCircleToday,
                  future && styles.dayCircleFuture,
                ]}
              >
                {day.hasWorkout ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : today ? (
                  <View style={styles.todayDot} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  today && styles.dayLabelToday,
                ]}
              >
                {dayLabel}
              </Text>
              {day.hasWorkout && typeLabel && (
                <Text style={styles.workoutType} numberOfLines={1}>
                  {typeLabel}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          {totalWorkouts} workout{totalWorkouts !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.summarySeparator}>{'\u2022'}</Text>
        <Text style={styles.summaryText}>
          {formatDuration(totalDurationMinutes)}
        </Text>
        <Text style={styles.summarySeparator}>{'\u2022'}</Text>
        <Text style={styles.summaryText}>
          {totalCaloriesBurned.toLocaleString()} kcal
        </Text>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  calories: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  dayWrapper: {
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    paddingVertical: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayCircleActive: {
    backgroundColor: '#34C759',
  },
  dayCircleToday: {
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dayCircleFuture: {
    backgroundColor: '#F2F2F7',
    opacity: 0.5,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
  dayLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  dayLabelToday: {
    color: '#007AFF',
    fontWeight: '600',
  },
  workoutType: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
    maxWidth: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 8,
  },
  summaryText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  summarySeparator: {
    fontSize: 15,
    color: '#C7C7CC',
  },
});

export default WeeklySummaryCard;

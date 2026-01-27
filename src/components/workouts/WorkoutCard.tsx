import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutType } from '../../types';

interface WorkoutCardProps {
  id: string;
  name: string | null;
  workoutType: WorkoutType;
  durationMinutes: number;
  caloriesBurned: number | null;
  time?: string;
  onPress?: () => void;
  style?: object;
}

// Workout type configuration with icons and colors
export const WORKOUT_TYPE_CONFIG: Record<
  WorkoutType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    gradientStart: string;
    gradientEnd: string;
  }
> = {
  STRENGTH: {
    icon: 'barbell',
    label: 'Strength',
    gradientStart: '#007AFF',
    gradientEnd: '#5856D6',
  },
  CARDIO_RUNNING: {
    icon: 'walk',
    label: 'Running',
    gradientStart: '#FF9500',
    gradientEnd: '#FF3B30',
  },
  CARDIO_CYCLING: {
    icon: 'bicycle',
    label: 'Cycling',
    gradientStart: '#34C759',
    gradientEnd: '#00C7BE',
  },
  CARDIO_SWIMMING: {
    icon: 'water',
    label: 'Swimming',
    gradientStart: '#5AC8FA',
    gradientEnd: '#007AFF',
  },
  HIIT: {
    icon: 'flash',
    label: 'HIIT',
    gradientStart: '#FF3B30',
    gradientEnd: '#FF9500',
  },
  YOGA: {
    icon: 'body',
    label: 'Yoga',
    gradientStart: '#AF52DE',
    gradientEnd: '#FF2D92',
  },
  PILATES: {
    icon: 'body',
    label: 'Pilates',
    gradientStart: '#5856D6',
    gradientEnd: '#AF52DE',
  },
  SPORTS: {
    icon: 'football',
    label: 'Sports',
    gradientStart: '#34C759',
    gradientEnd: '#007AFF',
  },
  WALKING: {
    icon: 'footsteps',
    label: 'Walking',
    gradientStart: '#00C7BE',
    gradientEnd: '#5AC8FA',
  },
  OTHER: {
    icon: 'fitness',
    label: 'Other',
    gradientStart: '#8E8E93',
    gradientEnd: '#636366',
  },
};

export function WorkoutCard({
  name,
  workoutType,
  durationMinutes,
  caloriesBurned,
  time,
  onPress,
  style,
}: WorkoutCardProps) {
  const config = WORKOUT_TYPE_CONFIG[workoutType];
  const displayName = name || config.label;

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
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${displayName}, ${config.label}, ${formatDuration(durationMinutes)}, ${caloriesBurned ?? 0} calories burned${time ? `, at ${time}` : ''}`}
      accessibilityHint="Double tap to view details"
      accessibilityRole="button"
    >
      <View style={[styles.iconContainer, { backgroundColor: config.gradientStart }]}>
        <Ionicons name={config.icon} size={20} color="#FFFFFF" />
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.details}>
          {formatDuration(durationMinutes)} {caloriesBurned !== null && `\u2022 ${caloriesBurned} kcal`}
        </Text>
        {time && <Text style={styles.time}>{time}</Text>}
      </View>

      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 72,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  details: {
    fontSize: 15,
    color: '#8E8E93',
  },
  time: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 2,
  },
});

export default WorkoutCard;

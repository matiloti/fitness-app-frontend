import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Progress bar colors following design spec
const PROGRESS_COLORS = {
  under: '#FF9500', // calorieGoal - 0-89%
  onTarget: '#34C759', // success - 90-100%
  over: '#FF3B30', // error - >100%
} as const;

export interface CalorieOverviewCardProps {
  /** Current calories consumed */
  current: number;
  /** Daily calorie goal */
  goal: number;
  /** Title to display (default: "Today's Calories") */
  title?: string;
  /** Whether to show the log button */
  showLogButton?: boolean;
  /** Callback when log button is pressed */
  onLogPress?: () => void;
  /** Optional custom style */
  style?: StyleProp<ViewStyle>;
}

export function CalorieOverviewCard({
  current,
  goal,
  title = "Today's Calories",
  showLogButton = true,
  onLogPress,
  style,
}: CalorieOverviewCardProps) {
  // Calculate percentage
  const percentage = goal > 0 ? Math.round((current / goal) * 100) : 0;
  const progressWidth = Math.min(percentage, 100);

  // Calculate remaining/over
  const remaining = goal - current;
  const isOver = remaining < 0;

  // Determine progress bar color based on percentage
  const getProgressColor = () => {
    if (percentage > 100) return PROGRESS_COLORS.over;
    if (percentage >= 90) return PROGRESS_COLORS.onTarget;
    return PROGRESS_COLORS.under;
  };

  // Determine remaining text color
  const getRemainingColor = () => {
    if (isOver) return PROGRESS_COLORS.over;
    return PROGRESS_COLORS.onTarget;
  };

  // Accessibility label
  const accessibilityLabel = `${title}: ${current.toLocaleString()} of ${goal.toLocaleString()} calories consumed, ${percentage}% of daily goal. ${
    isOver
      ? `${Math.abs(remaining).toLocaleString()} calories over goal`
      : `${remaining.toLocaleString()} calories remaining`
  }`;

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {showLogButton && onLogPress && (
          <TouchableOpacity
            style={styles.logButton}
            onPress={onLogPress}
            accessibilityLabel="Log food"
            accessibilityRole="button"
          >
            <Text style={styles.logButtonText}>Log</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Calorie display */}
      <View style={styles.calorieRow}>
        <Text style={styles.calorieValue}>
          {current.toLocaleString()}
        </Text>
        <Text style={styles.calorieSeparator}> / </Text>
        <Text style={styles.calorieGoal}>
          {goal.toLocaleString()} kcal
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressWidth}%`,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      {/* Remaining/Over text */}
      <Text style={[styles.remainingText, { color: getRemainingColor() }]}>
        {isOver
          ? `${Math.abs(remaining).toLocaleString()} kcal over goal`
          : `${remaining.toLocaleString()} kcal remaining`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  headerRow: {
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
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  logButtonText: {
    fontSize: 15,
    color: '#007AFF',
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  calorieSeparator: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  calorieGoal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    color: '#8E8E93',
    width: 36,
    textAlign: 'right',
  },
  remainingText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CalorieOverviewCard;

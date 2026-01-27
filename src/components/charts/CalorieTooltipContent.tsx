import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AdherenceStatus } from '../../types/analytics';

export interface CalorieTooltipData {
  /** Date of the entry */
  date: string;
  /** Calories consumed */
  consumed: number;
  /** Calorie goal */
  goal: number;
  /** Difference (negative = remaining, positive = over) */
  difference: number;
  /** Adherence status */
  adherence: AdherenceStatus;
  /** Workout calories burned */
  workoutCalories?: number;
  /** Net calories (consumed - burned) */
  netCalories?: number;
  /** Macros breakdown */
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  /** Whether this is aggregated data */
  isAggregated?: boolean;
  /** If aggregated, the date range label */
  dateRangeLabel?: string;
}

export interface CalorieTooltipContentProps {
  data: CalorieTooltipData;
}

/**
 * Content component for calorie bar chart tooltips.
 *
 * Displays:
 * - Date (formatted as weekday + date)
 * - Calories consumed
 * - Calorie goal
 * - Remaining/over calories (color-coded)
 * - Optional macro breakdown
 */
export function CalorieTooltipContent({ data }: CalorieTooltipContentProps) {
  const {
    date,
    consumed,
    goal,
    difference,
    adherence,
    workoutCalories,
    netCalories,
    macros,
    isAggregated,
    dateRangeLabel,
  } = data;

  // Format date
  const formattedDate = isAggregated
    ? dateRangeLabel ?? 'Average'
    : new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

  // Get difference color and text
  const getDifferenceDisplay = () => {
    const absDiff = Math.abs(difference);
    const formattedDiff = absDiff.toLocaleString();

    if (adherence === 'ON_TARGET' || absDiff <= 50) {
      return {
        text: 'Right on target!',
        color: '#007AFF',
        icon: 'checkmark-circle' as const,
      };
    } else if (difference < 0) {
      // Under goal - calories remaining
      return {
        text: `${formattedDiff} kcal remaining`,
        color: '#34C759',
        icon: 'add-circle' as const,
      };
    } else {
      // Over goal
      return {
        text: `${formattedDiff} kcal over goal`,
        color: '#FF3B30',
        icon: 'alert-circle' as const,
      };
    }
  };

  const differenceDisplay = getDifferenceDisplay();
  const hasMacros = macros && (macros.protein > 0 || macros.carbs > 0 || macros.fat > 0);
  const hasWorkoutData = workoutCalories !== undefined && workoutCalories > 0;

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${formattedDate}: ${consumed.toLocaleString()} calories consumed, goal ${goal.toLocaleString()}, ${differenceDisplay.text}`}
    >
      {/* Date */}
      <Text style={styles.date}>
        {formattedDate}
        {isAggregated && (
          <Text style={styles.aggregatedLabel}> (Average)</Text>
        )}
      </Text>

      {/* Consumed */}
      <Text style={styles.consumedValue}>
        {consumed.toLocaleString()}{' '}
        <Text style={styles.unit}>kcal consumed</Text>
      </Text>

      {/* Goal */}
      <Text style={styles.goalText}>
        Goal: {goal.toLocaleString()} kcal
      </Text>

      {/* Difference */}
      <View style={styles.differenceRow}>
        <Ionicons
          name={differenceDisplay.icon}
          size={16}
          color={differenceDisplay.color}
        />
        <Text style={[styles.differenceText, { color: differenceDisplay.color }]}>
          {differenceDisplay.text}
        </Text>
      </View>

      {/* Workout calories */}
      {hasWorkoutData && (
        <View style={styles.workoutRow}>
          <Ionicons name="flame-outline" size={14} color="#FF9500" />
          <Text style={styles.workoutText}>
            {workoutCalories!.toLocaleString()} kcal burned
          </Text>
          {netCalories !== undefined && (
            <Text style={styles.netText}>
              (Net: {netCalories.toLocaleString()})
            </Text>
          )}
        </View>
      )}

      {/* Macros breakdown */}
      {hasMacros && (
        <View style={styles.macrosSection}>
          <View style={styles.separator} />
          <Text style={styles.macrosTitle}>Macros</Text>
          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.macroLabel}>P:</Text>
              <Text style={styles.macroValue}>{macros!.protein}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: '#5856D6' }]} />
              <Text style={styles.macroLabel}>C:</Text>
              <Text style={styles.macroValue}>{macros!.carbs}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.macroLabel}>F:</Text>
              <Text style={styles.macroValue}>{macros!.fat}g</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 24, // Space for close button
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  aggregatedLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  consumedValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  unit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  goalText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
  },
  differenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  differenceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  workoutText: {
    fontSize: 12,
    color: '#FF9500',
  },
  netText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  macrosSection: {
    marginTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginBottom: 8,
  },
  macrosTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 16,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
});

export default CalorieTooltipContent;

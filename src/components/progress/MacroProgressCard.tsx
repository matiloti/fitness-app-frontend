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

// Macro color definitions following design spec
const MACRO_COLORS = {
  protein: {
    primary: '#34C759', // proteinColor
    track: 'rgba(52, 199, 89, 0.1)',
  },
  carbs: {
    primary: '#5856D6', // carbsColor
    track: 'rgba(88, 86, 214, 0.1)',
  },
  fat: {
    primary: '#FF3B30', // fatColor
    track: 'rgba(255, 59, 48, 0.1)',
  },
} as const;

const MACRO_LABELS = {
  protein: 'Protein',
  carbs: 'Carbohydrates',
  fat: 'Fat',
} as const;

export interface MacroProgressCardProps {
  /** The macronutrient type */
  macro: 'protein' | 'carbs' | 'fat';
  /** Current consumed amount in grams */
  current: number;
  /** Goal amount in grams */
  goal: number;
  /** Whether to show trend indicator */
  showTrend?: boolean;
  /** Trend direction if showTrend is true */
  trend?: 'up' | 'down' | 'stable';
  /** Callback when card is pressed */
  onPress?: () => void;
  /** Optional custom style */
  style?: StyleProp<ViewStyle>;
}

export function MacroProgressCard({
  macro,
  current,
  goal,
  showTrend = false,
  trend,
  onPress,
  style,
}: MacroProgressCardProps) {
  const colors = MACRO_COLORS[macro];
  const label = MACRO_LABELS[macro];

  // Calculate percentage (capped at 100% for display, but show actual value)
  const percentage = goal > 0 ? Math.round((current / goal) * 100) : 0;
  const progressWidth = Math.min(percentage, 100);

  // Calculate remaining
  const remaining = goal - current;
  const isOver = remaining < 0;

  // Accessibility label
  const accessibilityLabel = `${label}: ${Math.round(current)} of ${goal} grams, ${percentage}% of daily goal`;

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress
    ? {
        onPress,
        activeOpacity: 0.7,
        accessibilityLabel,
        accessibilityHint: 'Double tap to view detailed breakdown',
        accessibilityRole: 'button' as const,
      }
    : {
        accessibilityLabel,
        accessibilityRole: 'progressbar' as const,
        accessibilityValue: { min: 0, max: goal, now: current },
      };

  return (
    <Container
      style={[styles.container, style]}
      {...containerProps}
    >
      {/* Header row with macro name and percentage */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.macroName, { color: colors.primary }]}>
            {label}
          </Text>
          {showTrend && trend && trend !== 'stable' && (
            <Ionicons
              name={trend === 'up' ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={colors.primary}
              style={styles.trendIcon}
            />
          )}
        </View>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.track }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressWidth}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>

      {/* Footer row with current/goal and remaining */}
      <View style={styles.footerRow}>
        <Text style={styles.currentGoal}>
          {Math.round(current)}g of {goal}g
        </Text>
        <Text style={[styles.remaining, isOver && styles.remainingOver]}>
          {isOver
            ? `${Math.abs(Math.round(remaining))}g over`
            : `+${Math.round(remaining)}g left`}
        </Text>
      </View>

      {/* Chevron if pressable */}
      {onPress && (
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroName: {
    fontSize: 17,
    fontWeight: '600',
  },
  trendIcon: {
    marginLeft: 4,
  },
  percentage: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentGoal: {
    fontSize: 15,
    color: '#000000',
  },
  remaining: {
    fontSize: 12,
    color: '#8E8E93',
  },
  remainingOver: {
    color: '#FF3B30',
  },
  chevronContainer: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -8,
  },
});

export default MacroProgressCard;

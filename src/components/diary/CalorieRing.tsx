import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieRingProps {
  consumed: number;
  goal: number;
  exercise?: number; // Calories burned from exercise
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
}

export function CalorieRing({
  consumed,
  goal,
  exercise = 0,
  size = 200,
  strokeWidth = 16,
  showLabels = true,
}: CalorieRingProps) {
  // Adjusted goal increases with exercise (user can eat more after working out)
  // Formula: Available = Base Goal + Exercise Burned
  const adjustedGoal = goal + exercise;
  const progress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Progress is calculated based on consumed vs adjusted goal
  const percentage = Math.min((consumed / adjustedGoal) * 100, 150); // Cap at 150%
  const remaining = Math.max(adjustedGoal - consumed, 0);
  const isOverGoal = consumed > adjustedGoal;
  const isAtGoal = consumed >= adjustedGoal * 0.95 && consumed <= adjustedGoal * 1.05;

  // Determine color based on progress
  const getProgressColor = () => {
    if (isOverGoal) return '#FF3B30'; // error/red
    if (isAtGoal) return '#34C759'; // success/green
    return '#FF9500'; // calorieGoal/orange
  };

  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage, progress]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference * (1 - Math.min(progress.value, 1)),
    };
  });

  // For over 100%, show a second ring
  const overflowAnimatedProps = useAnimatedProps(() => {
    const overflowProgress = Math.max(0, progress.value - 1);
    return {
      strokeDashoffset: circumference * (1 - Math.min(overflowProgress, 0.5)),
    };
  });

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityLabel={
        exercise > 0
          ? `${consumed} calories consumed of ${adjustedGoal} adjusted goal (${goal} base + ${exercise} exercise), ${remaining} remaining, ${Math.round(percentage)}% of daily goal`
          : `${consumed} of ${goal} calories consumed, ${remaining} remaining, ${Math.round(percentage)}% of daily goal`
      }
      accessibilityValue={{ min: 0, max: adjustedGoal, now: consumed }}
    >
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#787880"
            strokeOpacity={0.2}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress ring */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={getProgressColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />

          {/* Overflow ring for > 100% */}
          {isOverGoal && (
            <AnimatedCircle
              cx={center}
              cy={center}
              r={radius - strokeWidth - 4}
              stroke="#FF3B30"
              strokeOpacity={0.5}
              strokeWidth={strokeWidth / 2}
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference * 0.8}
              animatedProps={overflowAnimatedProps}
            />
          )}
        </G>
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text style={styles.consumedValue}>{consumed.toLocaleString()}</Text>
        <View style={styles.divider} />
        <Text style={styles.goalValue}>{adjustedGoal.toLocaleString()}</Text>
        <Text style={styles.unitLabel}>kcal</Text>
      </View>

      {/* Status text below ring */}
      {showLabels && (
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, isOverGoal && styles.statusTextOver]}>
            {isOverGoal
              ? `${(consumed - adjustedGoal).toLocaleString()} over goal`
              : `${remaining.toLocaleString()} remaining`}
            {' • '}
            {Math.round(percentage)}% of goal
          </Text>
          {exercise > 0 && (
            <Text style={styles.exerciseText}>
              +{exercise.toLocaleString()} kcal from exercise
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumedValue: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#C6C6C8',
    marginVertical: 4,
  },
  goalValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
  },
  unitLabel: {
    fontSize: 13,
    color: '#AEAEB2',
    marginTop: 2,
  },
  statusContainer: {
    position: 'absolute',
    bottom: -30,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  exerciseText: {
    fontSize: 12,
    color: '#5856D6',
    marginTop: 2,
  },
  statusTextOver: {
    color: '#FF3B30',
  },
});

export default CalorieRing;

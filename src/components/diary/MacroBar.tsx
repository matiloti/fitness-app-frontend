import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type MacroType = 'protein' | 'carbs' | 'fat';

interface MacroBarProps {
  type: MacroType;
  current: number;
  goal: number;
  showValue?: boolean;
  showPercentage?: boolean;
  height?: number;
  animationDelay?: number;
}

const macroConfig: Record<MacroType, { color: string; label: string }> = {
  protein: { color: '#34C759', label: 'Protein' },
  carbs: { color: '#5856D6', label: 'Carbs' },
  fat: { color: '#FF3B30', label: 'Fat' },
};

export function MacroBar({
  type,
  current,
  goal,
  showValue = true,
  showPercentage = false,
  height = 8,
  animationDelay = 0,
}: MacroBarProps) {
  const progress = useSharedValue(0);
  const config = macroConfig[type];
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  useEffect(() => {
    const timeout = setTimeout(() => {
      progress.value = withTiming(percentage / 100, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    }, animationDelay);

    return () => clearTimeout(timeout);
  }, [percentage, progress, animationDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${config.label}: ${current} of ${goal} grams, ${Math.round(percentage)}%`}
    >
      <View style={styles.labelRow}>
        <Text style={styles.label}>{config.label}</Text>
        {showValue && (
          <Text style={styles.value}>
            {Math.round(current)}/{goal}g
            {showPercentage && ` (${Math.round(percentage)}%)`}
          </Text>
        )}
      </View>

      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: config.color, height },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

interface MacroSummaryProps {
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
}

export function MacroSummary({ protein, carbs, fat }: MacroSummaryProps) {
  return (
    <View style={styles.summaryContainer}>
      <MacroBar
        type="protein"
        current={protein.current}
        goal={protein.goal}
        animationDelay={0}
      />
      <MacroBar
        type="carbs"
        current={carbs.current}
        goal={carbs.goal}
        animationDelay={100}
      />
      <MacroBar
        type="fat"
        current={fat.current}
        goal={fat.goal}
        animationDelay={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
    width: 60,
  },
  value: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  track: {
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  summaryContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
});

export default MacroBar;

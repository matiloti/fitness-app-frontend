import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  goalStreak?: number;
  isActive?: boolean;
  onPress?: () => void;
}

// Streak milestone messages
const getStreakMessage = (streak: number, isActive: boolean): string => {
  if (!isActive && streak === 0) {
    return 'Start your streak today!';
  }
  if (!isActive) {
    return 'Get back on track!';
  }
  if (streak >= 90) return 'Legendary dedication!';
  if (streak >= 60) return 'Fitness warrior!';
  if (streak >= 30) return 'Monthly champion!';
  if (streak >= 14) return 'Two weeks unstoppable!';
  if (streak >= 7) return 'One week strong!';
  if (streak >= 5) return 'Keep the momentum going!';
  if (streak >= 3) return 'Getting started!';
  if (streak >= 1) return 'Great start!';
  return 'Start your streak today!';
};

export function StreakCard({
  currentStreak,
  longestStreak,
  goalStreak = 10,
  isActive = true,
  onPress,
}: StreakCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  // Flame pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Check for reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled().then((isReduced) => {
      if (!isReduced) {
        pulse.start();
      }
    });

    return () => pulse.stop();
  }, [pulseAnim]);

  // Progress dots animation on load
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((isReduced) => {
      if (isReduced) {
        progressAnim.setValue(currentStreak);
        countAnim.setValue(currentStreak);
      } else {
        Animated.parallel([
          Animated.timing(progressAnim, {
            toValue: currentStreak,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(countAnim, {
            toValue: currentStreak,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }
    });
  }, [currentStreak, progressAnim, countAnim]);

  const message = getStreakMessage(currentStreak, isActive);
  const streakProgress = Math.min(currentStreak, goalStreak);

  // Determine flame color based on streak
  const getFlameColors = (): [string, string] => {
    if (!isActive || currentStreak === 0) {
      return ['#C7C7CC', '#8E8E93']; // Gray for inactive
    }
    if (currentStreak >= 7) {
      return ['#FFD700', '#FF9500']; // Gold for 7+
    }
    return ['#FF9500', '#FF3B30']; // Orange-red for active
  };

  const flameColors = getFlameColors();

  // Render progress dots
  const renderProgressDots = () => {
    const dots = [];
    for (let i = 0; i < goalStreak; i++) {
      const isFilled = i < currentStreak;
      const isCurrent = i === currentStreak - 1;

      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            isFilled && styles.dotFilled,
            isCurrent && isActive && styles.dotCurrent,
          ]}
        >
          {isFilled && (
            <View style={styles.dotInner} />
          )}
        </View>
      );
    }
    return dots;
  };

  const accessibilityLabel = `${currentStreak} day workout streak. ${message}. Longest streak: ${longestStreak} days.`;

  // Don't show card if no streak and not active
  if (currentStreak === 0 && !isActive) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel="Start your workout streak today"
        accessibilityHint="Tap to log your first workout"
        accessibilityRole="button"
      >
        <View style={styles.emptyContent}>
          <Ionicons name="flame-outline" size={32} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>Start Your Streak</Text>
          <Text style={styles.emptySubtitle}>Log a workout to begin!</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Shows your current workout consistency"
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <Animated.View style={[styles.flameContainer, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={flameColors}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={styles.flameGradient}
          >
            <Ionicons name="flame" size={28} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <View style={styles.streakInfo}>
          <Text style={styles.streakValue}>
            {currentStreak}-Day Streak{currentStreak === 1 ? '' : '!'}
          </Text>
          <Text style={styles.streakMessage}>{message}</Text>
        </View>

        <View style={styles.bestStreak}>
          <Text style={styles.bestLabel}>Best</Text>
          <Text style={styles.bestValue}>{longestStreak}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.dotsContainer}>
          {renderProgressDots()}
        </View>
        <Text style={styles.progressLabel}>
          Day {streakProgress} of {goalStreak} to reach your next goal
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
    alignItems: 'center',
  },
  flameContainer: {
    marginRight: 16,
  },
  flameGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  streakMessage: {
    fontSize: 15,
    color: '#8E8E93',
  },
  bestStreak: {
    alignItems: 'center',
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#F2F2F7',
  },
  bestLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bestValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotFilled: {
    backgroundColor: '#34C759',
  },
  dotCurrent: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    padding: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
});

export default StreakCard;

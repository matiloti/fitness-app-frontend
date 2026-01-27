import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useWorkoutList,
  useWorkoutStreak,
  useWorkoutStats,
  useWeeklyOverview,
} from '../../../src/hooks/useWorkouts';
import {
  StreakCard,
  QuickStatsRow,
  RecentWorkouts,
  WeeklySummaryCard,
} from '../../../src/components/workouts';

// Empty State Component
function EmptyState({ onLogPress }: { onLogPress: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="fitness" size={64} color="#C7C7CC" />
      </View>
      <Text style={styles.emptyTitle}>Start Your Fitness Journey</Text>
      <Text style={styles.emptySubtitle}>
        Log your first workout to see{'\n'}your streak, stats, and more
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={onLogPress}
        accessibilityLabel="Log your first workout"
        accessibilityRole="button"
      >
        <Text style={styles.emptyButtonText}>Log Your First Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

// Floating Action Button Component
function LogWorkoutFAB({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.fabContainer}>
      <TouchableOpacity
        style={styles.fabButton}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel="Log a workout"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Log Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function WorkoutsScreen() {
  const router = useRouter();

  // Fetch all data
  const {
    data: workoutsData,
    isLoading: isLoadingWorkouts,
    isRefetching: isRefetchingWorkouts,
    refetch: refetchWorkouts,
  } = useWorkoutList({ size: 50 });

  const {
    data: streakData,
    isLoading: isLoadingStreak,
    refetch: refetchStreak,
  } = useWorkoutStreak();

  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useWorkoutStats();

  const {
    data: weeklyData,
    isLoading: isLoadingWeekly,
    refetch: refetchWeekly,
  } = useWeeklyOverview();

  const isLoading = isLoadingWorkouts || isLoadingStreak || isLoadingStats || isLoadingWeekly;
  const isRefetching = isRefetchingWorkouts;

  const handleRefresh = useCallback(() => {
    refetchWorkouts();
    refetchStreak();
    refetchStats();
    refetchWeekly();
  }, [refetchWorkouts, refetchStreak, refetchStats, refetchWeekly]);

  const handleLogWorkout = useCallback(() => {
    router.push('/workouts/log');
  }, [router]);

  const handleWorkoutPress = useCallback(
    (id: string) => {
      router.push(`/workouts/${id}`);
    },
    [router]
  );

  const handleHistoryPress = useCallback(() => {
    router.push('/workouts/history');
  }, [router]);

  const handleDayPress = useCallback(
    (date: string) => {
      // Navigate to log workout with pre-filled date
      router.push(`/workouts/log?date=${date}`);
    },
    [router]
  );

  const hasWorkouts = workoutsData?.content && workoutsData.content.length > 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workouts</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleLogWorkout}
          accessibilityLabel="Log workout"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color="#007AFF" />
          <Text style={styles.addButtonText}>Log</Text>
        </TouchableOpacity>
      </View>

      {!hasWorkouts ? (
        <EmptyState onLogPress={handleLogWorkout} />
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
            }
          >
            {/* Streak Card */}
            {streakData && (
              <StreakCard
                currentStreak={streakData.currentStreak}
                longestStreak={streakData.longestStreak}
                isActive={streakData.isActive}
              />
            )}

            {/* Weekly Summary Card */}
            {weeklyData && (
              <WeeklySummaryCard
                days={weeklyData.days}
                totalWorkouts={weeklyData.totalWorkouts}
                totalDurationMinutes={weeklyData.totalDurationMinutes}
                totalCaloriesBurned={weeklyData.totalCaloriesBurned}
                onDayPress={handleDayPress}
              />
            )}

            {/* Quick Stats */}
            {statsData && (
              <QuickStatsRow
                totalWorkouts={statsData.totalWorkouts}
                averageDurationMinutes={statsData.averageDurationMinutes}
                monthlyCalories={statsData.monthlyCalories}
                onSeeAllPress={handleHistoryPress}
              />
            )}

            {/* Recent Workouts */}
            {workoutsData?.content && (
              <RecentWorkouts
                workouts={workoutsData.content}
                onHistoryPress={handleHistoryPress}
                onWorkoutPress={handleWorkoutPress}
              />
            )}

            {/* Bottom padding for FAB */}
            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Floating Action Button */}
          <LogWorkoutFAB onPress={handleLogWorkout} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB
  },
  bottomPadding: {
    height: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

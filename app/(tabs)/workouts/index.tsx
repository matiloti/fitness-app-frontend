import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutList, useWorkoutSummary } from '../../../src/hooks/useWorkouts';
import { WorkoutCard, WORKOUT_TYPE_CONFIG } from '../../../src/components/workouts';
import type { WorkoutListItem } from '../../../src/services/workoutService';

// Helper to group workouts by date
function groupWorkoutsByDate(workouts: WorkoutListItem[]) {
  const groups: { [key: string]: WorkoutListItem[] } = {};
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  workouts.forEach((workout) => {
    const date = workout.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(workout);
  });

  return Object.entries(groups).map(([date, data]) => {
    let title = date;
    if (date === today) {
      title = 'Today';
    } else if (date === yesterday) {
      title = 'Yesterday';
    } else {
      // Format as "January 27"
      const dateObj = new Date(date);
      title = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }
    return { title, date, data };
  });
}

// Weekly Summary Card Component
function WeeklySummaryCard({
  totalWorkouts,
  totalCalories,
  totalDuration,
  workoutDays,
  onPress,
}: {
  totalWorkouts: number;
  totalCalories: number;
  totalDuration: number;
  workoutDays: string[];
  onPress?: () => void;
}) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  // Get days of the week (Mon-Sun)
  const getDaysOfWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push({
        label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
        date: date.toISOString().split('T')[0],
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    return days;
  };

  const daysOfWeek = getDaysOfWeek();

  return (
    <TouchableOpacity
      style={styles.summaryCard}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={`This week: ${totalWorkouts} workouts, ${totalCalories} calories burned, ${formatDuration(totalDuration)} total duration`}
    >
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>This Week</Text>
        <Text style={styles.summaryCalories}>{totalCalories.toLocaleString()} kcal</Text>
      </View>
      <Text style={styles.summarySubtitle}>
        {totalWorkouts} workout{totalWorkouts !== 1 ? 's' : ''} {'\u2022'} {formatDuration(totalDuration)} burned
      </Text>

      <View style={styles.weekDays}>
        {daysOfWeek.map((day) => {
          const hasWorkout = workoutDays.includes(day.date);
          return (
            <View key={day.date} style={styles.dayContainer}>
              <View
                style={[
                  styles.dayCircle,
                  hasWorkout && styles.dayCircleActive,
                  day.isToday && styles.dayCircleToday,
                ]}
              >
                {hasWorkout && (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                )}
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  day.isToday && styles.dayLabelToday,
                ]}
              >
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

// Empty State Component
function EmptyState({ onLogPress }: { onLogPress: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No workouts yet</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your exercise{'\n'}to see trends and calories burned
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

export default function WorkoutsScreen() {
  const router = useRouter();
  const {
    data: workoutsData,
    isLoading,
    isRefetching,
    refetch,
  } = useWorkoutList({ size: 50 });
  const { data: summaryData } = useWorkoutSummary();

  const sections = useMemo(() => {
    if (!workoutsData?.content) return [];
    return groupWorkoutsByDate(workoutsData.content);
  }, [workoutsData?.content]);

  const workoutDays = useMemo(() => {
    if (!workoutsData?.content) return [];
    const uniqueDays = new Set(workoutsData.content.map((w) => w.date));
    return Array.from(uniqueDays);
  }, [workoutsData?.content]);

  const handleLogWorkout = useCallback(() => {
    router.push('/workouts/log');
  }, [router]);

  const handleWorkoutPress = useCallback(
    (id: string) => {
      router.push(`/workouts/${id}`);
    },
    [router]
  );

  const renderHeader = () => (
    <>
      {workoutsData?.summary && workoutsData.summary.totalWorkouts > 0 && (
        <WeeklySummaryCard
          totalWorkouts={workoutsData.summary.totalWorkouts}
          totalCalories={workoutsData.summary.totalCalories}
          totalDuration={workoutsData.summary.totalDuration}
          workoutDays={workoutDays}
        />
      )}
    </>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderWorkout = ({ item }: { item: WorkoutListItem }) => (
    <WorkoutCard
      id={item.id}
      name={item.name}
      workoutType={item.workoutType}
      durationMinutes={item.durationMinutes}
      caloriesBurned={item.caloriesBurned}
      onPress={() => handleWorkoutPress(item.id)}
    />
  );

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

      {sections.length === 0 ? (
        <EmptyState onLogPress={handleLogWorkout} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderWorkout}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
  listContent: {
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  summaryCalories: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  summarySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  dayContainer: {
    alignItems: 'center',
    gap: 4,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: '#34C759',
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: '#007AFF',
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
  sectionHeader: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 68, // Align with content after icon
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
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
});

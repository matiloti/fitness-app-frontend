import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutList } from '../../../src/hooks/useWorkouts';
import { WorkoutCard, WORKOUT_TYPE_CONFIG } from '../../../src/components/workouts';
import type { WorkoutListItem } from '../../../src/services/workoutService';
import type { WorkoutType } from '../../../src/types';

// Filter options
const WORKOUT_TYPE_OPTIONS: { label: string; value: WorkoutType | null }[] = [
  { label: 'All Types', value: null },
  { label: 'Strength', value: 'STRENGTH' },
  { label: 'Running', value: 'CARDIO_RUNNING' },
  { label: 'Cycling', value: 'CARDIO_CYCLING' },
  { label: 'Swimming', value: 'CARDIO_SWIMMING' },
  { label: 'HIIT', value: 'HIIT' },
  { label: 'Yoga', value: 'YOGA' },
  { label: 'Pilates', value: 'PILATES' },
  { label: 'Walking', value: 'WALKING' },
  { label: 'Sports', value: 'SPORTS' },
  { label: 'Other', value: 'OTHER' },
];

type DateRangeOption = 'this_week' | 'this_month' | 'last_3_months' | 'this_year' | 'all_time';

const DATE_RANGE_OPTIONS: { label: string; value: DateRangeOption }[] = [
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last 3 Months', value: 'last_3_months' },
  { label: 'This Year', value: 'this_year' },
  { label: 'All Time', value: 'all_time' },
];

// Helper to get date range
function getDateRange(option: DateRangeOption): { startDate?: string; endDate?: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (option) {
    case 'this_week': {
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return { startDate: monday.toISOString().split('T')[0], endDate: today };
    }
    case 'this_month': {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: firstOfMonth.toISOString().split('T')[0], endDate: today };
    }
    case 'last_3_months': {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return { startDate: threeMonthsAgo.toISOString().split('T')[0], endDate: today };
    }
    case 'this_year': {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      return { startDate: firstOfYear.toISOString().split('T')[0], endDate: today };
    }
    case 'all_time':
    default:
      return {};
  }
}

// Helper to group workouts by date sections
function groupWorkoutsBySection(workouts: WorkoutListItem[]) {
  const groups: { [key: string]: WorkoutListItem[] } = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get start of this week (Monday)
  const startOfThisWeek = new Date(today);
  const dayOfWeek = today.getDay();
  startOfThisWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  // Get start of last week
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);

  workouts.forEach((workout) => {
    const workoutDate = new Date(workout.date);
    workoutDate.setHours(0, 0, 0, 0);

    let sectionKey: string;

    if (workoutDate.getTime() === today.getTime()) {
      sectionKey = 'TODAY';
    } else if (workoutDate.getTime() === yesterday.getTime()) {
      sectionKey = 'YESTERDAY';
    } else if (workoutDate >= startOfThisWeek && workoutDate < today) {
      sectionKey = 'THIS WEEK';
    } else if (workoutDate >= startOfLastWeek && workoutDate <= endOfLastWeek) {
      sectionKey = 'LAST WEEK';
    } else {
      // Group by month
      const monthYear = workoutDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      sectionKey = monthYear.toUpperCase();
    }

    if (!groups[sectionKey]) {
      groups[sectionKey] = [];
    }
    groups[sectionKey].push(workout);
  });

  // Convert to section list format with proper ordering
  const sectionOrder = ['TODAY', 'YESTERDAY', 'THIS WEEK', 'LAST WEEK'];
  const sections: { title: string; data: WorkoutListItem[] }[] = [];

  // Add ordered sections first
  sectionOrder.forEach((key) => {
    if (groups[key]) {
      sections.push({ title: key, data: groups[key] });
      delete groups[key];
    }
  });

  // Add remaining month sections (sorted by date descending)
  const monthSections = Object.entries(groups).sort((a, b) => {
    const dateA = new Date(a[1][0].date);
    const dateB = new Date(b[1][0].date);
    return dateB.getTime() - dateA.getTime();
  });

  monthSections.forEach(([title, data]) => {
    sections.push({ title, data });
  });

  return sections;
}

// Format relative date for workout row
function formatWorkoutDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = dateString.split('T')[0];
  const todayOnly = today.toISOString().split('T')[0];
  const yesterdayOnly = yesterday.toISOString().split('T')[0];

  if (dateOnly === todayOnly) {
    return 'Today';
  }
  if (dateOnly === yesterdayOnly) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Period Summary Card Component
function PeriodSummaryCard({
  periodLabel,
  totalWorkouts,
  totalDurationMinutes,
  totalCalories,
}: {
  periodLabel: string;
  totalWorkouts: number;
  totalDurationMinutes: number;
  totalCalories: number;
}) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}min`;
  };

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{periodLabel}</Text>
      <View style={styles.summaryStatsRow}>
        <Text style={styles.summaryStat}>{totalWorkouts} workouts</Text>
        <Text style={styles.summarySeparator}>{'\u2022'}</Text>
        <Text style={styles.summaryStat}>{formatDuration(totalDurationMinutes)}</Text>
        <Text style={styles.summarySeparator}>{'\u2022'}</Text>
        <Text style={styles.summaryStat}>{totalCalories.toLocaleString()} kcal</Text>
      </View>
    </View>
  );
}

// Filter Dropdown Component
function FilterDropdown({
  label,
  options,
  selectedValue,
  onSelect,
}: {
  label: string;
  options: { label: string; value: string | null }[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}) {
  const [visible, setVisible] = useState(false);
  const selectedLabel = options.find((o) => o.value === selectedValue)?.label || label;

  return (
    <>
      <TouchableOpacity
        style={styles.filterDropdown}
        onPress={() => setVisible(true)}
        accessibilityLabel={`Filter by ${label}: ${selectedLabel}`}
        accessibilityRole="button"
      >
        <Text style={styles.filterText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={16} color="#007AFF" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value ?? 'all'}
                style={[
                  styles.modalOption,
                  selectedValue === option.value && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  onSelect(option.value);
                  setVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedValue === option.value && styles.modalOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {selectedValue === option.value && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// Empty State Component
function EmptyState({
  hasFilters,
  onClearFilters,
  onLogWorkout,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onLogWorkout: () => void;
}) {
  if (hasFilters) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="filter" size={48} color="#C7C7CC" />
        <Text style={styles.emptyTitle}>No workouts match your filters</Text>
        <Text style={styles.emptySubtitle}>
          Try adjusting the filters{'\n'}or log a new workout
        </Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClearFilters}
          accessibilityLabel="Clear filters"
          accessibilityRole="button"
        >
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness" size={48} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No workout history yet</Text>
      <Text style={styles.emptySubtitle}>
        Start logging workouts to build{'\n'}your fitness journey
      </Text>
      <TouchableOpacity
        style={styles.logButton}
        onPress={onLogWorkout}
        accessibilityLabel="Log your first workout"
        accessibilityRole="button"
      >
        <Text style={styles.logButtonText}>Log Your First Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();

  // Filter state
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState<WorkoutType | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeOption>('this_month');
  const [page, setPage] = useState(0);

  // Get date range from filter
  const dateRange = useMemo(() => getDateRange(dateRangeFilter), [dateRangeFilter]);

  // Fetch workouts with filters
  const {
    data: workoutsData,
    isLoading,
    isRefetching,
    refetch,
    isFetchingNextPage,
  } = useWorkoutList({
    ...dateRange,
    workoutType: workoutTypeFilter ?? undefined,
    page,
    size: 20,
  });

  // Group workouts by sections
  const sections = useMemo(() => {
    if (!workoutsData?.content) return [];
    return groupWorkoutsBySection(workoutsData.content);
  }, [workoutsData?.content]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!workoutsData?.content) {
      return { totalWorkouts: 0, totalDuration: 0, totalCalories: 0 };
    }
    return workoutsData.content.reduce(
      (acc, workout) => ({
        totalWorkouts: acc.totalWorkouts + 1,
        totalDuration: acc.totalDuration + workout.durationMinutes,
        totalCalories: acc.totalCalories + (workout.caloriesBurned ?? 0),
      }),
      { totalWorkouts: 0, totalDuration: 0, totalCalories: 0 }
    );
  }, [workoutsData?.content]);

  // Get period label for summary
  const periodLabel = useMemo(() => {
    const option = DATE_RANGE_OPTIONS.find((o) => o.value === dateRangeFilter);
    if (dateRangeFilter === 'this_month') {
      return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return option?.label ?? 'All Time';
  }, [dateRangeFilter]);

  const hasFilters = workoutTypeFilter !== null || dateRangeFilter !== 'all_time';
  const hasMore = workoutsData?.page && workoutsData.page.number < workoutsData.page.totalPages - 1;

  const handleWorkoutPress = useCallback(
    (id: string) => {
      router.push(`/workouts/${id}`);
    },
    [router]
  );

  const handleClearFilters = useCallback(() => {
    setWorkoutTypeFilter(null);
    setDateRangeFilter('all_time');
    setPage(0);
  }, []);

  const handleLogWorkout = useCallback(() => {
    router.push('/workouts/log');
  }, [router]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetchingNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isFetchingNextPage]);

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderWorkout = ({ item }: { item: WorkoutListItem }) => {
    const config = WORKOUT_TYPE_CONFIG[item.workoutType];
    const displayName = item.name || config.label;
    const dateLabel = formatWorkoutDate(item.date);

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
        style={styles.workoutRow}
        onPress={() => handleWorkoutPress(item.id)}
        activeOpacity={0.7}
        accessibilityLabel={`${displayName}, ${config.label}, ${formatDuration(item.durationMinutes)}, ${item.caloriesBurned ?? 0} calories, ${dateLabel}`}
        accessibilityHint="Double tap to view workout details"
        accessibilityRole="button"
      >
        <View style={[styles.iconContainer, { backgroundColor: config.gradientStart }]}>
          <Ionicons name={config.icon} size={18} color="#FFFFFF" />
        </View>

        <View style={styles.content}>
          <Text style={styles.workoutName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.workoutDetails}>
            {formatDuration(item.durationMinutes)}
            {item.caloriesBurned !== null && ` \u2022 ${item.caloriesBurned} kcal`}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{dateLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color="#C7C7CC" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      );
    }

    if (hasMore) {
      return (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
          accessibilityLabel="Load more workouts"
          accessibilityRole="button"
        >
          <Text style={styles.loadMoreText}>Load more workouts...</Text>
        </TouchableOpacity>
      );
    }

    if (sections.length > 0) {
      return (
        <Text style={styles.endText}>No more workouts</Text>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'History',
            headerBackTitle: 'Workouts',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'History',
          headerBackTitle: 'Workouts',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Summary Card */}
        {summaryStats.totalWorkouts > 0 && (
          <PeriodSummaryCard
            periodLabel={periodLabel}
            totalWorkouts={summaryStats.totalWorkouts}
            totalDurationMinutes={summaryStats.totalDuration}
            totalCalories={summaryStats.totalCalories}
          />
        )}

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <FilterDropdown
            label="Workout Type"
            options={WORKOUT_TYPE_OPTIONS as { label: string; value: string | null }[]}
            selectedValue={workoutTypeFilter}
            onSelect={(value) => {
              setWorkoutTypeFilter(value as WorkoutType | null);
              setPage(0);
            }}
          />
          <FilterDropdown
            label="Date Range"
            options={DATE_RANGE_OPTIONS as { label: string; value: string | null }[]}
            selectedValue={dateRangeFilter}
            onSelect={(value) => {
              setDateRangeFilter((value as DateRangeOption) || 'all_time');
              setPage(0);
            }}
          />
        </View>

        {/* Workout List */}
        {sections.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onClearFilters={handleClearFilters}
            onLogWorkout={handleLogWorkout}
          />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderWorkout}
            renderSectionHeader={renderSectionHeader}
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryStat: {
    fontSize: 15,
    color: '#8E8E93',
  },
  summarySeparator: {
    fontSize: 15,
    color: '#C7C7CC',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  filterText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#F2F2F7',
  },
  modalOptionText: {
    fontSize: 17,
    color: '#000000',
  },
  modalOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 32,
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
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
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
  workoutName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  workoutDetails: {
    fontSize: 15,
    color: '#8E8E93',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  separator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 68,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 15,
    color: '#007AFF',
  },
  endText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  clearButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '500',
  },
  logButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  logButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

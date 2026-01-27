import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToday, useDay } from '../../src/hooks/useDays';
import type { AxiosError } from 'axios';
import { useAuthStore } from '../../src/stores/authStore';
import { CalorieRing, MacroSummary, MealCard } from '../../src/components/diary';
import { DateNavigation } from '../../src/components/diary/DatePicker';
import { getDateString, addDays } from '../../src/hooks/useDays';
import type { MealType } from '../../src/types';
import type { MealItem, MealTotals } from '../../src/services/mealService';

export default function TodayDashboardScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const today = getDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;

  // Fetch today's data or specific day's data
  const todayQuery = useToday();
  const dayQuery = useDay(isToday ? undefined : selectedDate);

  const { data: dayData, isLoading, isRefetching, refetch, error } = isToday
    ? todayQuery
    : dayQuery;

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDateChange = useCallback((newDate: string) => {
    setSelectedDate(newDate);
  }, []);

  const handleMealPress = useCallback((mealType: MealType) => {
    // Navigate to diary with meal type focus
    router.push('/diary');
  }, [router]);

  const handleAddFood = useCallback((mealType: MealType) => {
    // Navigate to food search for this meal
    router.push({
      pathname: '/diary/food-search',
      params: { mealType, date: selectedDate },
    });
  }, [router, selectedDate]);

  const handleFabPress = useCallback(() => {
    // Open food search
    router.push({
      pathname: '/diary/food-search',
      params: { date: selectedDate },
    });
  }, [router, selectedDate]);

  // Loading state
  if (isLoading && !dayData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your day...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if error is a 404 (no data for this day) - treat as empty state, not error
  const is404Error = error && (error as AxiosError)?.response?.status === 404;

  // Error state (only for non-404 errors)
  if (error && !dayData && !is404Error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#FF9500" />
          <Text style={styles.errorTitle}>Unable to load data</Text>
          <Text style={styles.errorMessage}>
            Check your connection and try again
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate values from data or use defaults
  const consumed = dayData?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goals = dayData?.goals || { calories: 2000, protein: 150, carbs: 250, fat: 65 };
  const meals = dayData?.meals || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}!
          </Text>
          <DateNavigation
            date={selectedDate}
            onDateChange={handleDateChange}
            maxDate={getDateString()}
          />
        </View>

        {/* Calorie Ring */}
        <View style={styles.calorieRingContainer}>
          <CalorieRing
            consumed={consumed.calories}
            goal={goals.calories}
            size={200}
            strokeWidth={16}
          />
        </View>

        {/* Macro Summary */}
        <View style={styles.section}>
          <MacroSummary
            protein={{ current: consumed.protein, goal: goals.protein }}
            carbs={{ current: consumed.carbs, goal: goals.carbs }}
            fat={{ current: consumed.fat, goal: goals.fat }}
          />
        </View>

        {/* Meals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meals</Text>
            <TouchableOpacity onPress={() => router.push('/diary')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {meals.length === 0 ? (
            <View style={styles.emptyMeals}>
              <Ionicons name="restaurant-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyMealsTitle}>No meals logged yet</Text>
              <Text style={styles.emptyMealsSubtitle}>
                Start by adding your breakfast
              </Text>
              <TouchableOpacity
                style={styles.addMealButton}
                onPress={() => handleAddFood('BREAKFAST')}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addMealButtonText}>Add First Meal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            meals.map((meal) => (
              <MealCard
                key={meal.id}
                mealType={meal.mealType}
                items={[]} // Summary view - no items
                totals={meal.totals as MealTotals}
                isCheatMeal={meal.isCheatMeal}
                onPress={() => handleMealPress(meal.mealType)}
                onAddFood={() => handleAddFood(meal.mealType)}
                collapsed={true}
              />
            ))
          )}
        </View>

        {/* Body Metrics Card */}
        {dayData?.bodyMetrics && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Body Metrics</Text>
              <TouchableOpacity onPress={() => router.push('/progress')}>
                <Text style={styles.seeAllText}>Log</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.metricsCard}>
              <View style={styles.metricRow}>
                <Ionicons name="scale-outline" size={28} color="#8E8E93" />
                <View style={styles.metricContent}>
                  <Text style={styles.metricValue}>
                    {dayData.bodyMetrics.weightKg?.toFixed(1) || '--'} kg
                  </Text>
                  <Text style={styles.metricLabel}>Weight</Text>
                </View>
              </View>
              {dayData.bodyMetrics.bodyFatPercentage && (
                <View style={styles.compositionRow}>
                  <View style={styles.compositionItem}>
                    <Text style={styles.compositionValue}>
                      {dayData.bodyMetrics.bodyFatPercentage.toFixed(1)}%
                    </Text>
                    <Text style={styles.compositionLabel}>Body Fat</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Workouts Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workouts</Text>
          </View>
          {dayData?.workouts && dayData.workouts.length > 0 ? (
            dayData.workouts.map((workout) => (
              <View key={workout.id} style={styles.workoutCard}>
                <Ionicons name="barbell-outline" size={24} color="#5856D6" />
                <View style={styles.workoutContent}>
                  <Text style={styles.workoutName}>{workout.name || workout.workoutType}</Text>
                  <Text style={styles.workoutMeta}>
                    {workout.durationMinutes} min • {workout.caloriesBurned} kcal
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyWorkouts}>
              <Ionicons name="fitness-outline" size={32} color="#C7C7CC" />
              <Text style={styles.emptyWorkoutsText}>No workouts yet today</Text>
              <TouchableOpacity>
                <Text style={styles.logWorkoutText}>+ Log Workout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom padding for FAB */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFabPress}
        accessibilityLabel="Add food"
        accessibilityHint="Double tap to search and add food"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  errorMessage: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    paddingVertical: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  calorieRingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  seeAllText: {
    fontSize: 15,
    color: '#007AFF',
  },
  emptyMeals: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyMealsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
  },
  emptyMealsSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
  },
  addMealButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  metricLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  compositionRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  compositionItem: {
    flex: 1,
    alignItems: 'center',
  },
  compositionValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  compositionLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  workoutContent: {
    flex: 1,
  },
  workoutName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
  },
  workoutMeta: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  emptyWorkouts: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyWorkoutsText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
  },
  logWorkoutText: {
    fontSize: 15,
    color: '#007AFF',
    marginTop: 8,
  },
  bottomPadding: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

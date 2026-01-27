import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToday, useDay, getDateString, addDays } from '../../src/hooks/useDays';
import { DateNavigation, WeekCalendar } from '../../src/components/diary/DatePicker';
import { MealCard } from '../../src/components/diary/MealCard';
import type { MealType } from '../../src/types';
import type { MealTotals, MealItem } from '../../src/services/mealService';
import type { AxiosError } from 'axios';

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

export default function DiaryScreen() {
  const router = useRouter();
  const today = getDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;

  // Use today's data or specific day data
  const todayQuery = useToday();
  const dayQuery = useDay(isToday ? undefined : selectedDate);

  const { data: dayData, isLoading, isRefetching, refetch, error } = isToday
    ? todayQuery
    : dayQuery;

  // Check if error is a 404 (no data for this day) - treat as empty state, not error
  const is404Error = error && (error as AxiosError)?.response?.status === 404;

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDateChange = useCallback((newDate: string) => {
    setSelectedDate(newDate);
  }, []);

  const handleAddFood = useCallback((mealType: MealType, mealId?: string) => {
    router.push({
      pathname: '/diary/food-search',
      params: { mealType, date: selectedDate, mealId },
    });
  }, [router, selectedDate]);

  const handleMealMorePress = useCallback((mealType: MealType, mealId: string) => {
    // Show action sheet for meal options
    // For now, just log
    console.log('More options for meal:', mealId);
  }, []);

  const handleItemPress = useCallback((item: MealItem, mealId: string) => {
    if (item.type === 'FOOD' && item.food) {
      router.push({
        pathname: `/diary/food/${item.food.id}`,
        params: { mealId, itemId: item.id },
      });
    } else if (item.type === 'QUICK_ENTRY') {
      // Edit quick entry
      console.log('Edit quick entry:', item.id);
    }
  }, [router]);

  // Organize meals by type
  const mealsByType = useMemo(() => {
    type DayMeal = NonNullable<typeof dayData>['meals'][0];
    const map: Record<MealType, DayMeal | null> = {
      BREAKFAST: null,
      LUNCH: null,
      DINNER: null,
      SNACK: null,
    };

    dayData?.meals?.forEach((meal) => {
      map[meal.mealType] = meal;
    });

    return map;
  }, [dayData?.meals]);

  // Calculate daily summary
  const dailySummary = useMemo(() => {
    const consumed = dayData?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const goals = dayData?.goals || { calories: 2000, protein: 150, carbs: 250, fat: 65 };
    const remaining = {
      calories: goals.calories - consumed.calories,
      protein: goals.protein - consumed.protein,
      carbs: goals.carbs - consumed.carbs,
      fat: goals.fat - consumed.fat,
    };
    const percentage = goals.calories > 0 ? Math.round((consumed.calories / goals.calories) * 100) : 0;

    return { consumed, goals, remaining, percentage };
  }, [dayData]);

  // Loading state
  if (isLoading && !dayData && !is404Error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading diary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state (only for non-404 errors)
  if (error && !dayData && !is404Error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="warning" size={48} color="#FF9500" />
          <Text style={styles.errorTitle}>Unable to load diary</Text>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Diary</Text>
      </View>

      {/* Date Navigation */}
      <DateNavigation
        date={selectedDate}
        onDateChange={handleDateChange}
        maxDate={today}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
      >
        {/* Daily Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Goal</Text>
              <Text style={styles.summaryValue}>{dailySummary.goals.calories.toLocaleString()}</Text>
              <Text style={styles.summaryUnit}>kcal</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Eaten</Text>
              <Text style={[styles.summaryValue, styles.summaryValuePrimary]}>
                {dailySummary.consumed.calories.toLocaleString()}
              </Text>
              <Text style={styles.summaryUnit}>kcal</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text
                style={[
                  styles.summaryValue,
                  dailySummary.remaining.calories >= 0
                    ? styles.summaryValueSuccess
                    : styles.summaryValueError,
                ]}
              >
                {Math.abs(dailySummary.remaining.calories).toLocaleString()}
              </Text>
              <Text style={styles.summaryUnit}>kcal</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(dailySummary.percentage, 100)}%` },
                  dailySummary.percentage > 100 && styles.progressFillOver,
                ]}
              />
            </View>
            <Text style={styles.progressText}>{dailySummary.percentage}%</Text>
          </View>

          {/* Macro row */}
          <View style={styles.macroRow}>
            <Text style={styles.macroItem}>
              P: {Math.round(dailySummary.consumed.protein)}/{dailySummary.goals.protein}g
            </Text>
            <Text style={styles.macroItem}>
              C: {Math.round(dailySummary.consumed.carbs)}/{dailySummary.goals.carbs}g
            </Text>
            <Text style={styles.macroItem}>
              F: {Math.round(dailySummary.consumed.fat)}/{dailySummary.goals.fat}g
            </Text>
          </View>
        </View>

        {/* Meal Sections */}
        {MEAL_TYPES.map((mealType) => {
          const meal = mealsByType[mealType];
          const mealId = meal?.id;

          return (
            <MealCard
              key={mealType}
              mealType={mealType}
              mealId={mealId}
              itemCount={meal?.itemCount ?? 0}
              totals={
                meal?.totals as MealTotals || {
                  calories: 0,
                  fat: 0,
                  carbs: 0,
                  protein: 0,
                }
              }
              isCheatMeal={meal?.isCheatMeal || false}
              onAddFood={() => handleAddFood(mealType, mealId)}
              onMorePress={() => mealId && handleMealMorePress(mealType, mealId)}
              onItemPress={(item) => mealId && handleItemPress(item, mealId)}
              collapsed={!meal || meal.itemCount === 0}
            />
          );
        })}

        {/* Add custom meal type button */}
        <TouchableOpacity
          style={styles.addMealTypeButton}
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'Custom meal types will be available in a future update.',
              [{ text: 'OK' }]
            )
          }
        >
          <Ionicons name="add" size={20} color="#007AFF" />
          <Text style={styles.addMealTypeText}>Add Meal Type</Text>
        </TouchableOpacity>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => handleAddFood('SNACK')}
        accessibilityLabel="Add food"
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
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryValuePrimary: {
    color: '#007AFF',
  },
  summaryValueSuccess: {
    color: '#34C759',
  },
  summaryValueError: {
    color: '#FF3B30',
  },
  summaryUnit: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
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
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressFillOver: {
    backgroundColor: '#FF3B30',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    width: 40,
    textAlign: 'right',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 24,
  },
  macroItem: {
    fontSize: 13,
    color: '#8E8E93',
  },
  addMealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  addMealTypeText: {
    fontSize: 17,
    color: '#007AFF',
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

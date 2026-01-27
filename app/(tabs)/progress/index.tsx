import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SegmentedControl } from '../../../src/components/ui';
import {
  PeriodSelector,
  LineChart,
  WeightTrendCard,
  BodyCompCard,
  PhotoGrid,
  PhotoEmptyState,
  CalorieOverviewCard,
  MacroProgressCard,
} from '../../../src/components/progress';
import { useLatestBodyMetrics, useBodyMetricsTrends, usePhotoTimeline } from '../../../src/hooks/useBodyMetrics';
import { useWeightTrend, useCalorieIntakeTrend, useWorkoutSummary, useDashboardSummary } from '../../../src/hooks/useAnalytics';
import type { Period } from '../../../src/types/analytics';

type TabType = 'body' | 'nutrition' | 'workouts';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('body');
  const [period, setPeriod] = useState<Period>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Body metrics data
  const latestMetrics = useLatestBodyMetrics();
  const metricsTrends = useBodyMetricsTrends(period);
  const weightTrend = useWeightTrend(period);
  const photoTimeline = usePhotoTimeline();

  // Nutrition data
  const caloriesTrend = useCalorieIntakeTrend(period);
  const dashboardSummary = useDashboardSummary();

  // Workouts data
  const workoutsSummary = useWorkoutSummary(period);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      latestMetrics.refetch(),
      metricsTrends.refetch(),
      weightTrend.refetch(),
      photoTimeline.refetch(),
      caloriesTrend.refetch(),
      dashboardSummary.refetch(),
      workoutsSummary.refetch(),
    ]);
    setIsRefreshing(false);
  }, [
    latestMetrics,
    metricsTrends,
    weightTrend,
    photoTimeline,
    caloriesTrend,
    dashboardSummary,
    workoutsSummary,
  ]);

  const handleLogMetrics = useCallback(() => {
    router.push('/progress/log');
  }, [router]);

  const handleSeeAllPhotos = useCallback(() => {
    router.push('/progress/photos');
  }, [router]);

  const handleSeeWeightChart = useCallback(() => {
    router.push('/progress/weight');
  }, [router]);

  const handleSeeBodyComp = useCallback(() => {
    router.push('/progress/body-comp');
  }, [router]);

  const handleSeeNutrition = useCallback(() => {
    router.push('/progress/nutrition');
  }, [router]);

  const renderBodyTab = () => {
    const latest = latestMetrics.data;
    const trends = metricsTrends.data;
    const weight = weightTrend.data;
    const photos = photoTimeline.data?.photos ?? [];

    if (latestMetrics.isLoading && !latest) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </View>
      );
    }

    return (
      <>
        {/* Today's Metrics Card */}
        <WeightTrendCard
          currentWeight={latest?.weightKg ?? null}
          change={trends?.weight?.change ?? null}
          changePercent={trends?.weight?.changePercent ?? null}
          trend={trends?.weight?.trend}
          onLogPress={handleLogMetrics}
          style={styles.card}
        />

        {/* Body Composition */}
        <View style={[styles.card, styles.bodyCompSection]}>
          <BodyCompCard
            bodyFat={{
              value: latest?.bodyFatPercentage ?? null,
              change: trends?.bodyFat?.change ?? null,
              trend: trends?.bodyFat?.trend,
            }}
            muscleMass={{
              value: latest?.muscleMassPercentage ?? null,
              change: trends?.muscleMass?.change ?? null,
              trend: trends?.muscleMass?.trend,
            }}
          />
        </View>

        {/* Weight Trend Chart */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weight Trend</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={handleSeeWeightChart}
              accessibilityLabel="See all weight data"
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <PeriodSelector
            value={period}
            onChange={setPeriod}
            style={styles.periodSelector}
          />

          {weight?.dataPoints && weight.dataPoints.length > 0 ? (
            <>
              <LineChart
                data={weight.dataPoints}
                trendLine={weight.trendLine}
                height={180}
                width={screenWidth - 64}
                style={styles.chart}
              />

              <View style={styles.chartSummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Start</Text>
                  <Text style={styles.summaryValue}>
                    {weight.statistics.startWeight.toFixed(1)} kg
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Current</Text>
                  <Text style={styles.summaryValue}>
                    {weight.statistics.endWeight.toFixed(1)} kg
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Change</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      {
                        color:
                          weight.statistics.totalChange < 0
                            ? '#34C759'
                            : weight.statistics.totalChange > 0
                            ? '#FF3B30'
                            : '#8E8E93',
                      },
                    ]}
                  >
                    {weight.statistics.totalChange >= 0 ? '+' : ''}
                    {weight.statistics.totalChange.toFixed(1)} kg
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>
                Log your weight to see trends
              </Text>
            </View>
          )}
        </View>

        {/* Body Composition Chart */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Body Composition</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={handleSeeBodyComp}
              accessibilityLabel="See all body composition data"
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.comingSoonText}>
            Body composition chart coming soon
          </Text>
        </View>

        {/* Progress Photos */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Progress Photos</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={handleSeeAllPhotos}
              accessibilityLabel="See all progress photos"
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {photos.length > 0 ? (
            <PhotoGrid
              photos={photos.slice(0, 4)}
              onAddPress={handleLogMetrics}
              onPhotoPress={(photo) => {
                router.push(`/progress/photos?highlight=${photo.metricsId}`);
              }}
            />
          ) : (
            <PhotoEmptyState onAddPress={handleLogMetrics} />
          )}
        </View>
      </>
    );
  };

  const handleLogFood = useCallback(() => {
    router.push('/diary');
  }, [router]);

  const renderNutritionTab = () => {
    const calories = caloriesTrend.data;
    const todayData = dashboardSummary.data?.today;

    if ((caloriesTrend.isLoading || dashboardSummary.isLoading) && !calories && !todayData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading nutrition data...</Text>
        </View>
      );
    }

    // Use today's data from dashboard summary for current day progress
    const caloriesCurrent = todayData?.caloriesConsumed ?? 0;
    const caloriesGoal = todayData?.calorieGoal ?? 2000;
    const macros = todayData?.macros;

    return (
      <>
        {/* Calorie Overview Card */}
        <CalorieOverviewCard
          current={caloriesCurrent}
          goal={caloriesGoal}
          showLogButton={true}
          onLogPress={handleLogFood}
          style={styles.card}
        />

        {/* Macros Section Label */}
        <Text style={styles.sectionLabel}>MACROS</Text>

        {/* Macro Progress Cards */}
        {macros ? (
          <>
            <MacroProgressCard
              macro="protein"
              current={macros.protein.consumed}
              goal={macros.protein.goal}
              style={styles.macroCard}
            />
            <MacroProgressCard
              macro="carbs"
              current={macros.carbs.consumed}
              goal={macros.carbs.goal}
              style={styles.macroCard}
            />
            <MacroProgressCard
              macro="fat"
              current={macros.fat.consumed}
              goal={macros.fat.goal}
              style={styles.macroCard}
            />
          </>
        ) : (
          <View style={[styles.card, styles.emptyChart]}>
            <Text style={styles.emptyChartText}>
              Log your meals to see macro progress
            </Text>
          </View>
        )}

        {/* Analytics Section Label */}
        <Text style={styles.sectionLabel}>ANALYTICS</Text>

        {/* Analytics Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Calorie Trend</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={handleSeeNutrition}
              accessibilityLabel="See all nutrition analytics"
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <PeriodSelector
            value={period}
            onChange={setPeriod}
            style={styles.periodSelector}
          />

          {calories?.statistics ? (
            <View style={styles.nutritionSummary}>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(calories.statistics.averageIntake).toLocaleString()}
                  </Text>
                  <Text style={styles.nutritionLabel}>Avg. kcal/day</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {calories.statistics.adherenceRate.toFixed(0)}%
                  </Text>
                  <Text style={styles.nutritionLabel}>On target</Text>
                </View>
              </View>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: '#34C759' }]}>
                    {calories.statistics.daysOnTarget}
                  </Text>
                  <Text style={styles.nutritionLabel}>Days on target</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: '#FF3B30' }]}>
                    {calories.statistics.daysOver}
                  </Text>
                  <Text style={styles.nutritionLabel}>Days over</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>
                Log your meals to see nutrition trends
              </Text>
            </View>
          )}
        </View>
      </>
    );
  };

  const renderWorkoutsTab = () => {
    const workouts = workoutsSummary.data;

    if (workoutsSummary.isLoading && !workouts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading workout data...</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week</Text>
          </View>

          <PeriodSelector
            value={period}
            onChange={setPeriod}
            style={styles.periodSelector}
          />

          {workouts?.summary ? (
            <View style={styles.workoutSummary}>
              <View style={styles.workoutMainStats}>
                <Text style={styles.workoutCount}>
                  {workouts.summary.totalWorkouts}
                </Text>
                <Text style={styles.workoutLabel}>workouts</Text>
              </View>
              <View style={styles.workoutSecondaryStats}>
                <View style={styles.workoutStatItem}>
                  <Text style={styles.workoutStatValue}>
                    {Math.round(workouts.summary.totalDurationMinutes / 60)}h{' '}
                    {workouts.summary.totalDurationMinutes % 60}min
                  </Text>
                  <Text style={styles.workoutStatLabel}>Total time</Text>
                </View>
                <View style={styles.workoutStatItem}>
                  <Text style={styles.workoutStatValue}>
                    {workouts.summary.totalCaloriesBurned.toLocaleString()}
                  </Text>
                  <Text style={styles.workoutStatLabel}>kcal burned</Text>
                </View>
              </View>
              <View style={styles.consistencyBar}>
                <View style={styles.consistencyTrack}>
                  <View
                    style={[
                      styles.consistencyFill,
                      {
                        width: `${workouts.summary.consistency.consistencyPercent}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.consistencyText}>
                  {workouts.summary.consistency.consistencyPercent.toFixed(0)}%
                  consistency
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>
                Log workouts to see your progress
              </Text>
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>

      <SegmentedControl
        options={[
          { value: 'body' as TabType, label: 'Body' },
          { value: 'nutrition' as TabType, label: 'Nutrition' },
          { value: 'workouts' as TabType, label: 'Workouts' },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        style={styles.segmentedControl}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'body' && renderBodyTab()}
        {activeTab === 'nutrition' && renderNutritionTab()}
        {activeTab === 'workouts' && renderWorkoutsTab()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000000',
  },
  segmentedControl: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bodyCompSection: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 15,
    color: '#007AFF',
  },
  periodSelector: {
    marginBottom: 16,
  },
  chart: {
    marginHorizontal: -8,
  },
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  emptyChart: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  emptyChartText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  comingSoonText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 40,
  },
  nutritionSummary: {
    gap: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  nutritionItem: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  nutritionLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  macroCard: {
    marginBottom: 12,
  },
  workoutSummary: {
    gap: 16,
  },
  workoutMainStats: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  workoutCount: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  workoutLabel: {
    fontSize: 17,
    color: '#8E8E93',
  },
  workoutSecondaryStats: {
    flexDirection: 'row',
    gap: 16,
  },
  workoutStatItem: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  workoutStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  workoutStatLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  consistencyBar: {
    gap: 8,
  },
  consistencyTrack: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  consistencyFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  consistencyText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});

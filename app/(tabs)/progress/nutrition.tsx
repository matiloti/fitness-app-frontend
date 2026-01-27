import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  PeriodSelector,
  CalorieOverviewCard,
  MacroProgressCard,
} from '../../../src/components/progress';
import { InteractiveBarChart } from '../../../src/components/charts';
import {
  useCalorieIntakeTrend,
  useMacroDistributionRange,
  useDashboardSummary,
} from '../../../src/hooks/useAnalytics';
import type { Period, AdherenceStatus, CalorieDataPoint } from '../../../src/types/analytics';

const screenWidth = Dimensions.get('window').width;

export default function NutritionScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('7d');
  const [selectedBar, setSelectedBar] = useState<CalorieDataPoint | null>(null);

  // Calculate date range for macro distribution
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = (() => {
    const date = new Date();
    switch (period) {
      case '7d':
        date.setDate(date.getDate() - 7);
        break;
      case '30d':
        date.setDate(date.getDate() - 30);
        break;
      case '90d':
        date.setDate(date.getDate() - 90);
        break;
      default:
        date.setDate(date.getDate() - 30);
    }
    return date.toISOString().split('T')[0];
  })();

  const caloriesTrend = useCalorieIntakeTrend(period);
  const macroDistribution = useMacroDistributionRange(startDate, endDate);
  const dashboardSummary = useDashboardSummary();

  const handleRefresh = useCallback(() => {
    caloriesTrend.refetch();
    macroDistribution.refetch();
    dashboardSummary.refetch();
  }, [caloriesTrend, macroDistribution, dashboardSummary]);

  const handleLogFood = useCallback(() => {
    router.push('/diary');
  }, [router]);

  const handleBarSelect = useCallback((point: CalorieDataPoint | null) => {
    setSelectedBar(point);
  }, []);

  const getAdherenceColor = (status: AdherenceStatus): string => {
    switch (status) {
      case 'UNDER':
        return '#FF9500';
      case 'ON_TARGET':
        return '#34C759';
      case 'OVER':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const isLoading =
    (caloriesTrend.isLoading && !caloriesTrend.data) ||
    (macroDistribution.isLoading && !macroDistribution.data) ||
    (dashboardSummary.isLoading && !dashboardSummary.data);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading nutrition data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const calories = caloriesTrend.data;
  const macros = macroDistribution.data;
  const todayData = dashboardSummary.data?.today;

  // Today's data for calorie and macro cards
  const caloriesCurrent = todayData?.caloriesConsumed ?? 0;
  const caloriesGoal = todayData?.calorieGoal ?? 2000;
  const todayMacros = todayData?.macros;

  // Determine how many data points to show based on period
  const getChartPoints = () => {
    switch (period) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      default:
        return 7;
    }
  };
  const chartPointCount = getChartPoints();

  // Prepare chart data based on selected period
  const chartData = calories?.dataPoints?.slice(-chartPointCount) ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              caloriesTrend.isRefetching ||
              macroDistribution.isRefetching ||
              dashboardSummary.isRefetching
            }
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Calorie Overview Card */}
        <CalorieOverviewCard
          current={caloriesCurrent}
          goal={caloriesGoal}
          showLogButton={true}
          onLogPress={handleLogFood}
          style={styles.card}
        />

        {/* Macros Section */}
        <Text style={styles.sectionLabel}>MACROS</Text>

        {todayMacros ? (
          <>
            <MacroProgressCard
              macro="protein"
              current={todayMacros.protein.consumed}
              goal={todayMacros.protein.goal}
              style={styles.macroCard}
            />
            <MacroProgressCard
              macro="carbs"
              current={todayMacros.carbs.consumed}
              goal={todayMacros.carbs.goal}
              style={styles.macroCard}
            />
            <MacroProgressCard
              macro="fat"
              current={todayMacros.fat.consumed}
              goal={todayMacros.fat.goal}
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

        {/* Analytics Section */}
        <Text style={styles.sectionLabel}>ANALYTICS</Text>

        {/* Calorie Trend Chart */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Calorie Trend</Text>
          <PeriodSelector
            value={period}
            onChange={setPeriod}
            options={[
              { value: '7d', label: '7D' },
              { value: '30d', label: '30D' },
              { value: '90d', label: '90D' },
            ]}
            style={styles.periodSelector}
          />

          {/* Bar Chart */}
          {chartData.length > 0 ? (
            <View style={styles.chartContainer}>
              <InteractiveBarChart
                data={chartData}
                height={180}
                width={screenWidth - 64}
                dailyGoal={calories?.dailyGoal}
                barPercentage={period === '7d' ? 0.6 : 0.8}
                scrollable={period !== '7d'}
                onBarSelect={handleBarSelect}
              />

              {/* Goal line indicator */}
              <View style={styles.goalLineInfo}>
                <View style={styles.goalLineDot} />
                <Text style={styles.goalLineText}>
                  Goal: {calories?.dailyGoal?.toLocaleString()} kcal
                </Text>
              </View>

              {/* Hint for interactive feature */}
              {!selectedBar && (
                <Text style={styles.chartHint}>
                  Tap bars to see details
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No calorie data available</Text>
            </View>
          )}
        </View>

        {/* Calorie Statistics */}
        {calories?.statistics && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Statistics</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.round(calories.statistics.averageIntake).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Avg. kcal/day</Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        calories.statistics.adherenceRate >= 70
                          ? '#34C759'
                          : '#FF9500',
                    },
                  ]}
                >
                  {calories.statistics.adherenceRate.toFixed(0)}%
                </Text>
                <Text style={styles.statLabel}>Adherence</Text>
              </View>
            </View>

            <View style={styles.adherenceRow}>
              <View style={styles.adherenceItem}>
                <View
                  style={[styles.adherenceDot, { backgroundColor: '#34C759' }]}
                />
                <Text style={styles.adherenceLabel}>On target</Text>
                <Text style={styles.adherenceValue}>
                  {calories.statistics.daysOnTarget} days
                </Text>
              </View>
              <View style={styles.adherenceItem}>
                <View
                  style={[styles.adherenceDot, { backgroundColor: '#FF9500' }]}
                />
                <Text style={styles.adherenceLabel}>Under</Text>
                <Text style={styles.adherenceValue}>
                  {calories.statistics.daysUnder} days
                </Text>
              </View>
              <View style={styles.adherenceItem}>
                <View
                  style={[styles.adherenceDot, { backgroundColor: '#FF3B30' }]}
                />
                <Text style={styles.adherenceLabel}>Over</Text>
                <Text style={styles.adherenceValue}>
                  {calories.statistics.daysOver} days
                </Text>
              </View>
            </View>

            <View style={styles.deficitInfo}>
              <Text style={styles.deficitLabel}>
                {calories.statistics.totalDeficit < 0
                  ? 'Total Deficit'
                  : 'Total Surplus'}
              </Text>
              <Text
                style={[
                  styles.deficitValue,
                  {
                    color:
                      calories.statistics.totalDeficit < 0
                        ? '#34C759'
                        : '#FF3B30',
                  },
                ]}
              >
                {Math.abs(calories.statistics.totalDeficit).toLocaleString()} kcal
              </Text>
            </View>
          </View>
        )}

        {/* Average Macro Distribution for Period */}
        {macros?.distribution && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Average Macro Distribution</Text>
            <Text style={styles.periodNote}>
              Based on {period === '7d' ? 'last 7 days' : period === '30d' ? 'last 30 days' : 'last 90 days'}
            </Text>

            {/* Macro summary bars */}
            <View style={styles.macroDistributionRow}>
              <View style={[styles.macroDistributionItem, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                <Text style={[styles.macroDistributionLabel, { color: '#34C759' }]}>Protein</Text>
                <Text style={styles.macroDistributionValue}>
                  {macros.distribution.protein.percent.toFixed(0)}%
                </Text>
                <Text style={styles.macroDistributionGrams}>
                  ~{Math.round(macros.distribution.protein.grams)}g/day
                </Text>
              </View>
              <View style={[styles.macroDistributionItem, { backgroundColor: 'rgba(88, 86, 214, 0.1)' }]}>
                <Text style={[styles.macroDistributionLabel, { color: '#5856D6' }]}>Carbs</Text>
                <Text style={styles.macroDistributionValue}>
                  {macros.distribution.carbs.percent.toFixed(0)}%
                </Text>
                <Text style={styles.macroDistributionGrams}>
                  ~{Math.round(macros.distribution.carbs.grams)}g/day
                </Text>
              </View>
              <View style={[styles.macroDistributionItem, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                <Text style={[styles.macroDistributionLabel, { color: '#FF3B30' }]}>Fat</Text>
                <Text style={styles.macroDistributionValue}>
                  {macros.distribution.fat.percent.toFixed(0)}%
                </Text>
                <Text style={styles.macroDistributionGrams}>
                  ~{Math.round(macros.distribution.fat.grams)}g/day
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Days */}
        {chartData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recent Days</Text>

            {chartData.slice(-7).reverse().map((day) => (
              <View key={day.date} style={styles.dayRow}>
                <Text style={styles.dayDate}>
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <View style={styles.dayValues}>
                  <Text style={styles.dayCalories}>
                    {day.consumed.toLocaleString()} kcal
                  </Text>
                  <View
                    style={[
                      styles.adherenceBadge,
                      { backgroundColor: `${getAdherenceColor(day.adherence)}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.adherenceBadgeText,
                        { color: getAdherenceColor(day.adherence) },
                      ]}
                    >
                      {day.adherence === 'ON_TARGET'
                        ? 'On target'
                        : day.adherence === 'UNDER'
                        ? 'Under'
                        : 'Over'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  macroCard: {
    marginBottom: 12,
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  periodSelector: {
    marginBottom: 16,
  },
  periodNote: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: -8,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartScrollContent: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  goalLineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  goalLineDot: {
    width: 8,
    height: 2,
    backgroundColor: '#007AFF',
  },
  goalLineText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  chartHint: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyChart: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  emptyChartText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  adherenceItem: {
    alignItems: 'center',
    gap: 4,
  },
  adherenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  adherenceLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  adherenceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  deficitInfo: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deficitLabel: {
    fontSize: 15,
    color: '#000000',
  },
  deficitValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  macroDistributionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroDistributionItem: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  macroDistributionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroDistributionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  macroDistributionGrams: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dayDate: {
    fontSize: 15,
    color: '#000000',
  },
  dayValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayCalories: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  adherenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adherenceBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});

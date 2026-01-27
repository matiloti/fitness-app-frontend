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
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { PeriodSelector } from '../../../src/components/progress';
import { useCalorieIntakeTrend, useMacroDistributionRange } from '../../../src/hooks/useAnalytics';
import type { Period, AdherenceStatus } from '../../../src/types/analytics';

const screenWidth = Dimensions.get('window').width;

export default function NutritionScreen() {
  const [period, setPeriod] = useState<Period>('7d');

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

  const handleRefresh = useCallback(() => {
    caloriesTrend.refetch();
    macroDistribution.refetch();
  }, [caloriesTrend, macroDistribution]);

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
    (macroDistribution.isLoading && !macroDistribution.data);

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

  // Prepare bar chart data based on selected period
  const chartData = calories?.dataPoints?.slice(-chartPointCount).map((point) => ({
    date: point.date,
    consumed: point.consumed,
    goal: point.goal,
    adherence: point.adherence,
  })) ?? [];

  // For longer periods, show fewer labels to keep the chart readable
  const getLabelInterval = () => {
    switch (period) {
      case '7d':
        return 1; // Show all labels
      case '30d':
        return 7; // Show weekly labels
      case '90d':
        return 14; // Show bi-weekly labels
      default:
        return 1;
    }
  };
  const labelInterval = getLabelInterval();

  const barChartData = {
    labels: chartData.map((d, index) => {
      // Only show labels at the interval to avoid overcrowding
      if (index % labelInterval !== 0 && index !== chartData.length - 1) {
        return '';
      }
      const date = new Date(d.date + 'T00:00:00');
      if (period === '7d') {
        return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
      }
      // For longer periods, show date as M/D format
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        data: chartData.map((d) => d.consumed),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={caloriesTrend.isRefetching || macroDistribution.isRefetching}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Period Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Calorie Intake</Text>
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={period !== '7d'}
                contentContainerStyle={styles.chartScrollContent}
              >
                <BarChart
                  data={barChartData}
                  width={Math.max(screenWidth - 64, chartData.length * 12)}
                  height={180}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: () => '#007AFF',
                    labelColor: () => '#8E8E93',
                    barPercentage: period === '7d' ? 0.6 : 0.8,
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: '#E5E5EA',
                      strokeWidth: 1,
                    },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars={false}
                  fromZero
                />
              </ScrollView>

              {/* Goal line indicator */}
              <View style={styles.goalLineInfo}>
                <View style={styles.goalLineDot} />
                <Text style={styles.goalLineText}>
                  Goal: {calories?.dailyGoal?.toLocaleString()} kcal
                </Text>
              </View>
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

        {/* Macro Distribution */}
        {macros?.distribution && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Average Macro Distribution</Text>

            {/* Macro Bars */}
            <View style={styles.macroSection}>
              {/* Protein */}
              <View style={styles.macroRow}>
                <View style={styles.macroInfo}>
                  <View
                    style={[styles.macroDot, { backgroundColor: '#34C759' }]}
                  />
                  <Text style={styles.macroName}>Protein</Text>
                </View>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        width: `${macros.distribution.protein.percent}%`,
                        backgroundColor: '#34C759',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.macroPercent}>
                  {macros.distribution.protein.percent.toFixed(0)}%
                </Text>
              </View>
              <Text style={styles.macroGrams}>
                {Math.round(macros.distribution.protein.grams)}g
              </Text>

              {/* Carbs */}
              <View style={styles.macroRow}>
                <View style={styles.macroInfo}>
                  <View
                    style={[styles.macroDot, { backgroundColor: '#5856D6' }]}
                  />
                  <Text style={styles.macroName}>Carbs</Text>
                </View>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        width: `${macros.distribution.carbs.percent}%`,
                        backgroundColor: '#5856D6',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.macroPercent}>
                  {macros.distribution.carbs.percent.toFixed(0)}%
                </Text>
              </View>
              <Text style={styles.macroGrams}>
                {Math.round(macros.distribution.carbs.grams)}g
              </Text>

              {/* Fat */}
              <View style={styles.macroRow}>
                <View style={styles.macroInfo}>
                  <View
                    style={[styles.macroDot, { backgroundColor: '#FF3B30' }]}
                  />
                  <Text style={styles.macroName}>Fat</Text>
                </View>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        width: `${macros.distribution.fat.percent}%`,
                        backgroundColor: '#FF3B30',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.macroPercent}>
                  {macros.distribution.fat.percent.toFixed(0)}%
                </Text>
              </View>
              <Text style={styles.macroGrams}>
                {Math.round(macros.distribution.fat.grams)}g
              </Text>
            </View>
          </View>
        )}

        {/* Recent Days */}
        {chartData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recent Days</Text>

            {chartData.slice().reverse().map((day) => (
              <View key={day.date} style={styles.dayRow}>
                <Text style={styles.dayDate}>
                  {new Date(day.date).toLocaleDateString('en-US', {
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  periodSelector: {
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
  macroSection: {
    gap: 8,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macroName: {
    fontSize: 14,
    color: '#000000',
  },
  macroBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    width: 36,
    textAlign: 'right',
  },
  macroGrams: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 88,
    marginBottom: 8,
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

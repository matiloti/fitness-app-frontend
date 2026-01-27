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
import { PeriodSelector } from '../../../src/components/progress';
import { InteractiveLineChart } from '../../../src/components/charts';
import { useWeightTrend } from '../../../src/hooks/useAnalytics';
import type { Period, TrendDirection, WeightDataPoint } from '../../../src/types/analytics';

const screenWidth = Dimensions.get('window').width;

export default function WeightChartScreen() {
  const [period, setPeriod] = useState<Period>('30d');
  const [selectedPoint, setSelectedPoint] = useState<WeightDataPoint | null>(null);
  const { data, isLoading, isRefetching, refetch } = useWeightTrend(period);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDataPointSelect = useCallback((point: WeightDataPoint | null) => {
    setSelectedPoint(point);
  }, []);

  const getTrendIcon = (trend: TrendDirection): string => {
    switch (trend) {
      case 'INCREASING':
        return 'arrow-up';
      case 'DECREASING':
        return 'arrow-down';
      case 'STABLE':
      default:
        return 'remove';
    }
  };

  const getTrendColor = (trend: TrendDirection): string => {
    switch (trend) {
      case 'DECREASING':
        return '#34C759';
      case 'INCREASING':
        return '#FF3B30';
      case 'STABLE':
      default:
        return '#8E8E93';
    }
  };

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading weight data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = data?.statistics;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
      >
        {/* Period Selector */}
        <View style={styles.card}>
          <PeriodSelector
            value={period}
            onChange={setPeriod}
            style={styles.periodSelector}
          />

          {/* Chart */}
          {data?.dataPoints && data.dataPoints.length > 0 ? (
            <InteractiveLineChart
              data={data.dataPoints}
              trendLine={data.trendLine}
              height={220}
              width={screenWidth - 64}
              style={styles.chart}
              onDataPointSelect={handleDataPointSelect}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>
                No weight data for this period
              </Text>
            </View>
          )}

          {/* Hint text for interactivity */}
          {data?.dataPoints && data.dataPoints.length > 0 && !selectedPoint && (
            <Text style={styles.chartHint}>Tap on data points to see details</Text>
          )}
        </View>

        {/* Statistics */}
        {stats && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Statistics</Text>

            {/* Summary Row */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Start</Text>
                <Text style={styles.summaryValue}>
                  {stats.startWeight.toFixed(1)}
                </Text>
                <Text style={styles.summaryUnit}>kg</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Current</Text>
                <Text style={[styles.summaryValue, styles.summaryValueHighlight]}>
                  {stats.endWeight.toFixed(1)}
                </Text>
                <Text style={styles.summaryUnit}>kg</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Change</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: getTrendColor(stats.trend) },
                  ]}
                >
                  {stats.totalChange >= 0 ? '+' : ''}
                  {stats.totalChange.toFixed(1)}
                </Text>
                <Text style={styles.summaryUnit}>kg</Text>
              </View>
            </View>

            {/* Trend indicator */}
            <View style={styles.trendRow}>
              <View
                style={[
                  styles.trendBadge,
                  { backgroundColor: `${getTrendColor(stats.trend)}15` },
                ]}
              >
                <Ionicons
                  name={getTrendIcon(stats.trend) as any}
                  size={16}
                  color={getTrendColor(stats.trend)}
                />
                <Text style={[styles.trendText, { color: getTrendColor(stats.trend) }]}>
                  {stats.trend === 'DECREASING'
                    ? 'Losing weight'
                    : stats.trend === 'INCREASING'
                    ? 'Gaining weight'
                    : 'Stable'}
                </Text>
              </View>
              <Text style={styles.changePercent}>
                {stats.changePercent >= 0 ? '+' : ''}
                {stats.changePercent.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        {/* Detailed Stats */}
        {stats && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Minimum weight</Text>
              <Text style={styles.detailValue}>{stats.minWeight.toFixed(1)} kg</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Maximum weight</Text>
              <Text style={styles.detailValue}>{stats.maxWeight.toFixed(1)} kg</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Average weight</Text>
              <Text style={styles.detailValue}>{stats.averageWeight.toFixed(1)} kg</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weekly rate</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: getTrendColor(stats.trend) },
                ]}
              >
                {stats.ratePerWeek >= 0 ? '+' : ''}
                {stats.ratePerWeek.toFixed(2)} kg/week
              </Text>
            </View>
          </View>
        )}

        {/* Date Range Info */}
        {data && (
          <View style={styles.dateInfo}>
            <Text style={styles.dateInfoText}>
              Data from {new Date(data.startDate).toLocaleDateString()} to{' '}
              {new Date(data.endDate).toLocaleDateString()}
            </Text>
            <Text style={styles.dateInfoText}>
              {data.dataPoints.length} measurements
            </Text>
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
  periodSelector: {
    marginBottom: 16,
  },
  chart: {
    marginHorizontal: -8,
  },
  emptyChart: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  emptyChartText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  chartHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
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
    height: 48,
    backgroundColor: '#E5E5EA',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  summaryValueHighlight: {
    color: '#007AFF',
  },
  summaryUnit: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  changePercent: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailLabel: {
    fontSize: 15,
    color: '#000000',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  dateInfo: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  dateInfoText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  bottomPadding: {
    height: 40,
  },
});

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
import { useBodyCompositionTrend } from '../../../src/hooks/useAnalytics';
import type { Period, TrendDirection } from '../../../src/types/analytics';

const screenWidth = Dimensions.get('window').width;

export default function BodyCompScreen() {
  const [period, setPeriod] = useState<Period>('30d');
  const { data, isLoading, isRefetching, refetch, error } = useBodyCompositionTrend(period);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const getTrendIcon = (change: number): string => {
    if (change > 0) return 'arrow-up';
    if (change < 0) return 'arrow-down';
    return 'remove';
  };

  const formatChange = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '--';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}`;
  };

  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '--';
    return value.toFixed(1);
  };

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading body composition...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle error state
  if (error && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.card}>
            <View style={styles.emptyStateContainer}>
              <Ionicons name="analytics-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyStateTitle}>No Data Yet</Text>
              <Text style={styles.emptyStateText}>
                Start logging your body metrics to see your composition trends over time.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const stats = data?.statistics;
  const dataPoints = data?.dataPoints ?? [];

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

          {/* Chart placeholder */}
          <View style={styles.chartPlaceholder}>
            <Ionicons name="analytics-outline" size={48} color="#8E8E93" />
            <Text style={styles.chartPlaceholderText}>
              Multi-line chart coming soon
            </Text>
            <Text style={styles.chartPlaceholderSubtext}>
              Will show weight, body fat, and muscle mass trends
            </Text>
          </View>
        </View>

        {/* Current Stats */}
        {stats && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Current Status</Text>

            <View style={styles.statsGrid}>
              {/* Weight */}
              {stats.weight && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Weight</Text>
                  <Text style={styles.statValue}>
                    {formatValue(stats.weight.end)}
                  </Text>
                  <Text style={styles.statUnit}>kg</Text>
                  <View style={styles.statChange}>
                    <Ionicons
                      name={getTrendIcon(stats.weight.change ?? 0) as any}
                      size={14}
                      color={(stats.weight.change ?? 0) < 0 ? '#34C759' : '#FF3B30'}
                    />
                    <Text
                      style={[
                        styles.statChangeText,
                        {
                          color:
                            (stats.weight.change ?? 0) < 0 ? '#34C759' : '#FF3B30',
                        },
                      ]}
                    >
                      {formatChange(stats.weight.change)} kg
                    </Text>
                  </View>
                </View>
              )}

              {/* Body Fat */}
              {stats.bodyFat && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Body Fat</Text>
                  <Text style={styles.statValue}>
                    {formatValue(stats.bodyFat.end)}
                  </Text>
                  <Text style={styles.statUnit}>%</Text>
                  <View style={styles.statChange}>
                    <Ionicons
                      name={getTrendIcon(stats.bodyFat.change ?? 0) as any}
                      size={14}
                      color={(stats.bodyFat.change ?? 0) < 0 ? '#34C759' : '#FF3B30'}
                    />
                    <Text
                      style={[
                        styles.statChangeText,
                        {
                          color:
                            (stats.bodyFat.change ?? 0) < 0 ? '#34C759' : '#FF3B30',
                        },
                      ]}
                    >
                      {formatChange(stats.bodyFat.change)}%
                    </Text>
                  </View>
                </View>
              )}

              {/* Muscle Mass */}
              {stats.muscleMass && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Muscle</Text>
                  <Text style={styles.statValue}>
                    {formatValue(stats.muscleMass.end)}
                  </Text>
                  <Text style={styles.statUnit}>%</Text>
                  <View style={styles.statChange}>
                    <Ionicons
                      name={getTrendIcon(stats.muscleMass.change ?? 0) as any}
                      size={14}
                      color={(stats.muscleMass.change ?? 0) > 0 ? '#34C759' : '#FF3B30'}
                    />
                    <Text
                      style={[
                        styles.statChangeText,
                        {
                          color:
                            (stats.muscleMass.change ?? 0) > 0
                              ? '#34C759'
                              : '#FF3B30',
                        },
                      ]}
                    >
                      {formatChange(stats.muscleMass.change)}%
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Progress Comparison */}
        {stats && (stats.weight || stats.bodyFat || stats.muscleMass) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Progress Comparison</Text>

            {/* Weight Progress */}
            {stats.weight && (
              <View style={styles.progressRow}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>Weight</Text>
                  <Text style={styles.progressRange}>
                    {formatValue(stats.weight.start)} kg{' '}
                    <Ionicons name="arrow-forward" size={12} color="#8E8E93" />{' '}
                    {formatValue(stats.weight.end)} kg
                  </Text>
                </View>
                <Text
                  style={[
                    styles.progressChange,
                    { color: (stats.weight.change ?? 0) < 0 ? '#34C759' : '#FF3B30' },
                  ]}
                >
                  {formatChange(stats.weight.changePercent)}%
                </Text>
              </View>
            )}

            {/* Body Fat Progress */}
            {stats.bodyFat && (
              <View style={styles.progressRow}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>Body Fat</Text>
                  <Text style={styles.progressRange}>
                    {formatValue(stats.bodyFat.start)}%{' '}
                    <Ionicons name="arrow-forward" size={12} color="#8E8E93" />{' '}
                    {formatValue(stats.bodyFat.end)}%
                  </Text>
                </View>
                <Text
                  style={[
                    styles.progressChange,
                    { color: (stats.bodyFat.change ?? 0) < 0 ? '#34C759' : '#FF3B30' },
                  ]}
                >
                  {formatChange(stats.bodyFat.changePercent)}%
                </Text>
              </View>
            )}

            {/* Muscle Mass Progress */}
            {stats.muscleMass && (
              <View style={styles.progressRow}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>Muscle Mass</Text>
                  <Text style={styles.progressRange}>
                    {formatValue(stats.muscleMass.start)}%{' '}
                    <Ionicons name="arrow-forward" size={12} color="#8E8E93" />{' '}
                    {formatValue(stats.muscleMass.end)}%
                  </Text>
                </View>
                <Text
                  style={[
                    styles.progressChange,
                    { color: (stats.muscleMass.change ?? 0) > 0 ? '#34C759' : '#FF3B30' },
                  ]}
                >
                  {formatChange(stats.muscleMass.changePercent)}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Entries */}
        {dataPoints.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>

            {dataPoints.slice(-5).reverse().map((entry, index) => (
              <View key={entry.date} style={styles.entryRow}>
                <Text style={styles.entryDate}>
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <View style={styles.entryValues}>
                  <Text style={styles.entryValue}>{entry.weight.toFixed(1)} kg</Text>
                  {entry.bodyFatPercentage !== null && (
                    <Text style={styles.entryValue}>
                      {entry.bodyFatPercentage.toFixed(1)}% fat
                    </Text>
                  )}
                  {entry.muscleMassPercentage !== null && (
                    <Text style={styles.entryValue}>
                      {entry.muscleMassPercentage.toFixed(1)}% muscle
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Date Range Info */}
        {data && (
          <View style={styles.dateInfo}>
            <Text style={styles.dateInfoText}>
              Data from {new Date(data.startDate).toLocaleDateString()} to{' '}
              {new Date(data.endDate).toLocaleDateString()}
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
  chartPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    gap: 8,
  },
  chartPlaceholderText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#8E8E93',
  },
  chartPlaceholderSubtext: {
    fontSize: 13,
    color: '#AEAEB2',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  statUnit: {
    fontSize: 13,
    color: '#8E8E93',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
  },
  statChangeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  progressRange: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  progressChange: {
    fontSize: 17,
    fontWeight: '600',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  entryDate: {
    fontSize: 15,
    color: '#000000',
    width: 60,
  },
  entryValues: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  entryValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  dateInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  dateInfoText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  bottomPadding: {
    height: 40,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});

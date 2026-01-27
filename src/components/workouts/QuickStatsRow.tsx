import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickStatsRowProps {
  totalWorkouts: number;
  averageDurationMinutes: number;
  monthlyCalories: number;
  onSeeAllPress?: () => void;
}

interface StatCardProps {
  value: string;
  label: string;
  accessibilityLabel: string;
}

function StatCard({ value, label, accessibilityLabel }: StatCardProps) {
  return (
    <View
      style={styles.statCard}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function QuickStatsRow({
  totalWorkouts,
  averageDurationMinutes,
  monthlyCalories,
  onSeeAllPress,
}: QuickStatsRowProps) {
  // Format duration
  const formatDuration = (minutes: number | null | undefined): string => {
    if (minutes === null || minutes === undefined) return '0 min';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${Math.round(minutes)} min`;
  };

  // Format calories (use k for thousands)
  const formatCalories = (calories: number | null | undefined): string => {
    if (calories === null || calories === undefined) return '0';
    if (calories >= 1000) {
      return `${(calories / 1000).toFixed(1)}k`;
    }
    return calories.toString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Stats</Text>
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={onSeeAllPress}
          accessibilityLabel="See all workout statistics"
          accessibilityRole="button"
        >
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          value={(totalWorkouts ?? 0).toString()}
          label="Total Workouts"
          accessibilityLabel={`${totalWorkouts ?? 0} total workouts`}
        />
        <StatCard
          value={formatDuration(averageDurationMinutes)}
          label="Avg Time"
          accessibilityLabel={`Average workout time: ${formatDuration(averageDurationMinutes)}`}
        />
        <StatCard
          value={formatCalories(monthlyCalories)}
          label="kcal This Month"
          accessibilityLabel={`${monthlyCalories ?? 0} calories burned this month`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 15,
    color: '#007AFF',
    marginRight: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default QuickStatsRow;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface WeightTooltipData {
  /** Date of the measurement */
  date: string;
  /** Weight value */
  weight: number;
  /** Unit of measurement (kg or lbs) */
  unit: string;
  /** Change from previous measurement (positive = gained, negative = lost) */
  changeFromPrevious?: number | null;
  /** Body fat percentage if available */
  bodyFatPercent?: number | null;
  /** Muscle mass percentage if available */
  muscleMassPercent?: number | null;
  /** Whether this is aggregated data (weekly/monthly average) */
  isAggregated?: boolean;
  /** If aggregated, the date range label */
  dateRangeLabel?: string;
  /** If aggregated, the min/max values */
  minWeight?: number;
  maxWeight?: number;
}

export interface WeightTooltipContentProps {
  data: WeightTooltipData;
}

/**
 * Content component for weight chart tooltips.
 *
 * Displays:
 * - Date of measurement (formatted)
 * - Weight value with unit
 * - Change from previous measurement (color-coded)
 * - Optional body composition data
 */
export function WeightTooltipContent({ data }: WeightTooltipContentProps) {
  const {
    date,
    weight,
    unit,
    changeFromPrevious,
    bodyFatPercent,
    muscleMassPercent,
    isAggregated,
    dateRangeLabel,
    minWeight,
    maxWeight,
  } = data;

  // Format date
  const formattedDate = isAggregated
    ? dateRangeLabel ?? 'Average'
    : new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  // Format change value
  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} ${unit}`;
  };

  // Get change color (green for loss, red for gain - assuming weight loss goal)
  const getChangeColor = (change: number): string => {
    if (change < 0) return '#34C759'; // Green - losing weight
    if (change > 0) return '#FF3B30'; // Red - gaining weight
    return '#8E8E93'; // Gray - no change
  };

  // Get change icon
  const getChangeIcon = (change: number): string => {
    if (change < 0) return 'arrow-down';
    if (change > 0) return 'arrow-up';
    return 'remove';
  };

  const hasChange = changeFromPrevious !== null && changeFromPrevious !== undefined;
  const hasBodyComp = (bodyFatPercent !== null && bodyFatPercent !== undefined) ||
    (muscleMassPercent !== null && muscleMassPercent !== undefined);
  const hasRange = isAggregated && minWeight !== undefined && maxWeight !== undefined;

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Weight on ${formattedDate}: ${weight.toFixed(1)} ${unit}${
        hasChange ? `, change: ${formatChange(changeFromPrevious)}` : ''
      }`}
    >
      {/* Date */}
      <Text style={styles.date}>
        {formattedDate}
        {isAggregated && (
          <Text style={styles.aggregatedLabel}> (Average)</Text>
        )}
      </Text>

      {/* Weight Value */}
      <Text style={styles.weightValue}>
        {weight.toFixed(1)}{' '}
        <Text style={styles.unit}>{unit}</Text>
      </Text>

      {/* Change from previous */}
      {hasChange && (
        <View style={styles.changeRow}>
          <Ionicons
            name={getChangeIcon(changeFromPrevious!) as any}
            size={14}
            color={getChangeColor(changeFromPrevious!)}
          />
          <Text style={[styles.changeText, { color: getChangeColor(changeFromPrevious!) }]}>
            {formatChange(changeFromPrevious!)}
          </Text>
          <Text style={styles.changeLabel}>from previous</Text>
        </View>
      )}

      {/* Range for aggregated data */}
      {hasRange && (
        <Text style={styles.rangeText}>
          Range: {minWeight!.toFixed(1)} - {maxWeight!.toFixed(1)} {unit}
        </Text>
      )}

      {/* Body composition data */}
      {hasBodyComp && (
        <View style={styles.bodyCompSection}>
          <View style={styles.separator} />
          {bodyFatPercent !== null && bodyFatPercent !== undefined && (
            <View style={styles.bodyCompRow}>
              <Text style={styles.bodyCompLabel}>Body Fat:</Text>
              <Text style={styles.bodyCompValue}>{bodyFatPercent.toFixed(1)}%</Text>
            </View>
          )}
          {muscleMassPercent !== null && muscleMassPercent !== undefined && (
            <View style={styles.bodyCompRow}>
              <Text style={styles.bodyCompLabel}>Muscle:</Text>
              <Text style={styles.bodyCompValue}>{muscleMassPercent.toFixed(1)}%</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 24, // Space for close button
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  aggregatedLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  weightValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  changeLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  rangeText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  bodyCompSection: {
    marginTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginBottom: 8,
  },
  bodyCompRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bodyCompLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  bodyCompValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
});

export default WeightTooltipContent;

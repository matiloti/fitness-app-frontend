import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';
import type { WeightDataPoint, TrendLinePoint } from '../../types/analytics';

// Define the chart data type inline since it's not exported
interface ChartDataset {
  data: number[];
  color?: (opacity?: number) => string;
  strokeWidth?: number;
  withDots?: boolean;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

const screenWidth = Dimensions.get('window').width;

interface LineChartProps {
  data: WeightDataPoint[];
  trendLine?: TrendLinePoint[];
  height?: number;
  width?: number;
  color?: string;
  showTrendLine?: boolean;
  formatYLabel?: (value: number) => string;
  formatXLabel?: (date: string, index: number) => string;
  yAxisSuffix?: string;
  unit?: string;
  style?: object;
}

export function LineChart({
  data,
  trendLine,
  height = 200,
  width = screenWidth - 32,
  color = '#007AFF',
  showTrendLine = true,
  formatYLabel,
  formatXLabel,
  yAxisSuffix = '',
  unit = 'kg',
  style,
}: LineChartProps) {
  // Transform data for chart-kit
  const chartData = useMemo((): ChartData => {
    if (!data || data.length === 0) {
      return {
        labels: ['No data'],
        datasets: [{ data: [0] }],
      };
    }

    // Sample data points to avoid overcrowding (max 7 labels)
    const maxLabels = 7;
    const step = Math.max(1, Math.floor(data.length / maxLabels));
    const sampledIndices = Array.from(
      { length: Math.min(maxLabels, data.length) },
      (_, i) => Math.min(i * step, data.length - 1)
    );

    // Always include first and last
    if (!sampledIndices.includes(0)) sampledIndices.unshift(0);
    if (!sampledIndices.includes(data.length - 1)) {
      sampledIndices.push(data.length - 1);
    }

    const labels = data.map((point, index) => {
      if (sampledIndices.includes(index)) {
        if (formatXLabel) {
          return formatXLabel(point.date, index);
        }
        const date = new Date(point.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return '';
    });

    const datasets: ChartDataset[] = [
      {
        data: data.map((point) => point.weight),
        color: () => color,
        strokeWidth: 2,
      },
    ];

    // Add trend line if available
    if (showTrendLine && trendLine && trendLine.length >= 2) {
      // Interpolate trend line to match data points
      const trendValues = data.map((point) => {
        const startDate = new Date(trendLine[0].date).getTime();
        const endDate = new Date(trendLine[trendLine.length - 1].date).getTime();
        const pointDate = new Date(point.date).getTime();
        const ratio = (pointDate - startDate) / (endDate - startDate);
        const startValue = trendLine[0].value;
        const endValue = trendLine[trendLine.length - 1].value;
        return startValue + (endValue - startValue) * ratio;
      });

      datasets.push({
        data: trendValues,
        color: () => `${color}40`,
        strokeWidth: 1,
        withDots: false,
      });
    }

    return {
      labels,
      datasets,
    };
  }, [data, trendLine, color, showTrendLine, formatXLabel]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }, style]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      <RNLineChart
        data={chartData}
        width={width}
        height={height}
        yAxisSuffix={yAxisSuffix}
        formatYLabel={formatYLabel ? (value) => formatYLabel(parseFloat(value)) : undefined}
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 1,
          color: () => color,
          labelColor: () => '#8E8E93',
          style: {
            borderRadius: 12,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: color,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#E5E5EA',
            strokeWidth: 1,
          },
          fillShadowGradient: color,
          fillShadowGradientOpacity: 0.1,
        }}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        fromZero={false}
        segments={4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
    paddingRight: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
});

export default LineChart;

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  GestureResponderEvent,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LineChart as RNLineChart } from 'react-native-chart-kit';
import { ChartTooltip, type ChartTooltipPosition } from './ChartTooltip';
import { WeightTooltipContent, type WeightTooltipData } from './WeightTooltipContent';
import type { WeightDataPoint, TrendLinePoint } from '../../types/analytics';

const screenWidth = Dimensions.get('window').width;

// Touch target size (44pt as per iOS HIG)
const TOUCH_TARGET_SIZE = 44;

// Chart padding (must match chart-kit's internal padding)
const CHART_PADDING_LEFT = 55; // Y-axis labels width
const CHART_PADDING_RIGHT = 16;
const CHART_PADDING_TOP = 16;
const CHART_PADDING_BOTTOM = 32; // X-axis labels height

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

export interface InteractiveLineChartProps {
  /** Weight data points to display */
  data: WeightDataPoint[];
  /** Optional trend line data */
  trendLine?: TrendLinePoint[];
  /** Chart height */
  height?: number;
  /** Chart width */
  width?: number;
  /** Primary color for the chart */
  color?: string;
  /** Whether to show the trend line */
  showTrendLine?: boolean;
  /** Custom Y-axis label formatter */
  formatYLabel?: (value: number) => string;
  /** Custom X-axis label formatter */
  formatXLabel?: (date: string, index: number) => string;
  /** Y-axis suffix */
  yAxisSuffix?: string;
  /** Unit of measurement for tooltip */
  unit?: string;
  /** Container style */
  style?: object;
  /** Called when a data point is selected */
  onDataPointSelect?: (point: WeightDataPoint | null, index: number | null) => void;
}

/**
 * Interactive line chart with tooltip support.
 *
 * Wraps react-native-chart-kit's LineChart and adds:
 * - Touch detection with 44pt target areas
 * - Tooltip display on data point selection
 * - Haptic feedback on selection
 */
export function InteractiveLineChart({
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
  onDataPointSelect,
}: InteractiveLineChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<ChartTooltipPosition | null>(null);
  const [chartLayout, setChartLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const chartRef = useRef<View>(null);

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

  // Calculate data point positions
  const dataPointPositions = useMemo(() => {
    if (!data || data.length === 0 || chartLayout.width === 0) {
      return [];
    }

    const chartWidth = chartLayout.width - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
    const chartHeight = chartLayout.height - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

    const weights = data.map((p) => p.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight || 1; // Avoid division by zero

    return data.map((point, index) => {
      // Calculate X position
      const x = CHART_PADDING_LEFT + (index / Math.max(1, data.length - 1)) * chartWidth;

      // Calculate Y position (inverted because Y increases downward)
      const normalizedWeight = (point.weight - minWeight) / weightRange;
      const y = CHART_PADDING_TOP + (1 - normalizedWeight) * chartHeight;

      return { x, y, index };
    });
  }, [data, chartLayout]);

  // Handle chart layout change
  const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setChartLayout({ x, y, width, height });
  }, []);

  // Find closest data point to touch position
  const findClosestPoint = useCallback(
    (touchX: number, touchY: number) => {
      if (dataPointPositions.length === 0) return null;

      let closestIndex: number | null = null;
      let closestDistance = Infinity;

      dataPointPositions.forEach(({ x, y, index }) => {
        const distance = Math.sqrt(Math.pow(touchX - x, 2) + Math.pow(touchY - y, 2));

        if (distance < TOUCH_TARGET_SIZE / 2 && distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      return closestIndex;
    },
    [dataPointPositions]
  );

  // Handle touch on chart
  const handleChartTouch = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      const closestIndex = findClosestPoint(locationX, locationY);

      if (closestIndex !== null && closestIndex !== selectedIndex) {
        // Select new point
        Haptics.selectionAsync();
        setSelectedIndex(closestIndex);

        // Calculate tooltip position (in screen coordinates)
        const pointPos = dataPointPositions[closestIndex];
        if (pointPos) {
          // Measure chart position on screen
          chartRef.current?.measure((x, y, w, h, pageX, pageY) => {
            setTooltipPosition({
              x: pageX + pointPos.x,
              y: pageY + pointPos.y,
            });
          });
        }

        onDataPointSelect?.(data[closestIndex], closestIndex);
      } else if (closestIndex === null && selectedIndex !== null) {
        // Deselect
        setSelectedIndex(null);
        setTooltipPosition(null);
        onDataPointSelect?.(null, null);
      }
    },
    [findClosestPoint, selectedIndex, dataPointPositions, data, onDataPointSelect]
  );

  // Dismiss tooltip
  const handleDismissTooltip = useCallback(() => {
    setSelectedIndex(null);
    setTooltipPosition(null);
    onDataPointSelect?.(null, null);
  }, [onDataPointSelect]);

  // Get tooltip data for selected point
  const getTooltipData = useCallback((): WeightTooltipData | null => {
    if (selectedIndex === null || !data[selectedIndex]) return null;

    const point = data[selectedIndex];
    const previousPoint = selectedIndex > 0 ? data[selectedIndex - 1] : null;
    const changeFromPrevious = previousPoint
      ? point.weight - previousPoint.weight
      : null;

    return {
      date: point.date,
      weight: point.weight,
      unit,
      changeFromPrevious,
    };
  }, [selectedIndex, data, unit]);

  const tooltipData = getTooltipData();

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={style}>
      <Pressable
        ref={chartRef}
        onPress={handleChartTouch}
        onLayout={handleChartLayout}
        style={styles.chartContainer}
        accessibilityLabel="Weight trend chart"
        accessibilityHint="Tap on data points to see details"
      >
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
              r: selectedIndex !== null ? '6' : '4',
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
      </Pressable>

      {/* Tooltip */}
      <ChartTooltip
        visible={selectedIndex !== null && tooltipData !== null}
        position={tooltipPosition}
        onDismiss={handleDismissTooltip}
        accessibilityLabel={
          tooltipData
            ? `Weight on ${tooltipData.date}: ${tooltipData.weight.toFixed(1)} ${unit}`
            : undefined
        }
      >
        {tooltipData && <WeightTooltipContent data={tooltipData} />}
      </ChartTooltip>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    position: 'relative',
  },
  chart: {
    borderRadius: 12,
    paddingRight: 0,
  },
});

export default InteractiveLineChart;

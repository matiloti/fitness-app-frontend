import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  GestureResponderEvent,
  Pressable,
  LayoutChangeEvent,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BarChart } from 'react-native-chart-kit';
import { ChartTooltip, type ChartTooltipPosition } from './ChartTooltip';
import { CalorieTooltipContent, type CalorieTooltipData } from './CalorieTooltipContent';
import type { CalorieDataPoint } from '../../types/analytics';

const screenWidth = Dimensions.get('window').width;

// Touch target width (per bar)
const MIN_BAR_TOUCH_WIDTH = 20;

// Chart padding (must match chart-kit's internal padding)
const CHART_PADDING_LEFT = 40; // Y-axis labels width
const CHART_PADDING_RIGHT = 8;
const CHART_PADDING_TOP = 16;
const CHART_PADDING_BOTTOM = 32; // X-axis labels height

export interface InteractiveBarChartProps {
  /** Calorie data points to display */
  data: CalorieDataPoint[];
  /** Chart height */
  height?: number;
  /** Chart width (minimum) */
  width?: number;
  /** Primary color for bars */
  color?: string;
  /** Daily calorie goal for reference line */
  dailyGoal?: number;
  /** Bar percentage (0-1) */
  barPercentage?: number;
  /** Whether the chart should scroll horizontally */
  scrollable?: boolean;
  /** Custom X-axis label formatter */
  formatXLabel?: (date: string, index: number) => string;
  /** Container style */
  style?: object;
  /** Called when a bar is selected */
  onBarSelect?: (point: CalorieDataPoint | null, index: number | null) => void;
}

/**
 * Interactive bar chart with tooltip support.
 *
 * Wraps react-native-chart-kit's BarChart and adds:
 * - Touch detection on bars
 * - Tooltip display on bar selection
 * - Haptic feedback on selection
 */
export function InteractiveBarChart({
  data,
  height = 180,
  width = screenWidth - 64,
  color = '#007AFF',
  dailyGoal,
  barPercentage = 0.6,
  scrollable = false,
  formatXLabel,
  style,
  onBarSelect,
}: InteractiveBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<ChartTooltipPosition | null>(null);
  const [chartLayout, setChartLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const chartRef = useRef<View>(null);

  // Calculate actual chart width based on data length
  const chartWidth = useMemo(() => {
    const minWidthPerBar = 24;
    const calculatedWidth = data.length * minWidthPerBar + CHART_PADDING_LEFT + CHART_PADDING_RIGHT;
    return Math.max(width, calculatedWidth);
  }, [data.length, width]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: ['No data'],
        datasets: [{ data: [0] }],
      };
    }

    // Format labels
    const labels = data.map((d, index) => {
      if (formatXLabel) {
        return formatXLabel(d.date, index);
      }
      const date = new Date(d.date + 'T00:00:00');
      // Show abbreviated day for weekly view
      if (data.length <= 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
      }
      // Show date for longer views with sparse labeling
      if (index % 7 === 0 || index === data.length - 1) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      return '';
    });

    return {
      labels,
      datasets: [{ data: data.map((d) => d.consumed) }],
    };
  }, [data, formatXLabel]);

  // Calculate bar positions
  const barPositions = useMemo(() => {
    if (!data || data.length === 0 || chartLayout.width === 0) {
      return [];
    }

    const chartAreaWidth = chartWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
    const barWidth = chartAreaWidth / data.length;

    return data.map((_, index) => {
      // Calculate X center of the bar
      const x = CHART_PADDING_LEFT + (index + 0.5) * barWidth;
      return { x, barWidth, index };
    });
  }, [data, chartLayout, chartWidth]);

  // Handle chart layout change
  const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setChartLayout({ x, y, width, height });
  }, []);

  // Find which bar was tapped
  const findTappedBar = useCallback(
    (touchX: number) => {
      if (barPositions.length === 0) return null;

      for (const { x, barWidth, index } of barPositions) {
        const touchTargetWidth = Math.max(barWidth, MIN_BAR_TOUCH_WIDTH);
        const barLeft = x - touchTargetWidth / 2;
        const barRight = x + touchTargetWidth / 2;

        if (touchX >= barLeft && touchX <= barRight) {
          return index;
        }
      }

      return null;
    },
    [barPositions]
  );

  // Handle touch on chart
  const handleChartTouch = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY, pageX, pageY } = event.nativeEvent;
      const tappedIndex = findTappedBar(locationX);

      if (tappedIndex !== null && tappedIndex !== selectedIndex) {
        // Select new bar
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedIndex(tappedIndex);

        // Calculate tooltip position
        const barPos = barPositions[tappedIndex];
        if (barPos) {
          // Get the chart's position on screen
          chartRef.current?.measure((x, y, w, h, chartPageX, chartPageY) => {
            // Position tooltip above the chart, centered on the bar
            const tooltipY = chartPageY + CHART_PADDING_TOP + 20; // Near top of chart
            const tooltipX = chartPageX + barPos.x;
            setTooltipPosition({
              x: tooltipX,
              y: tooltipY,
            });
          });
        }

        onBarSelect?.(data[tappedIndex], tappedIndex);
      } else if (tappedIndex === null && selectedIndex !== null) {
        // Deselect
        setSelectedIndex(null);
        setTooltipPosition(null);
        onBarSelect?.(null, null);
      }
    },
    [findTappedBar, selectedIndex, barPositions, data, onBarSelect]
  );

  // Dismiss tooltip
  const handleDismissTooltip = useCallback(() => {
    setSelectedIndex(null);
    setTooltipPosition(null);
    onBarSelect?.(null, null);
  }, [onBarSelect]);

  // Get tooltip data for selected bar
  const getTooltipData = useCallback((): CalorieTooltipData | null => {
    if (selectedIndex === null || !data[selectedIndex]) return null;

    const point = data[selectedIndex];

    return {
      date: point.date,
      consumed: point.consumed,
      goal: point.goal,
      difference: point.difference,
      adherence: point.adherence,
      workoutCalories: point.workoutCalories,
      netCalories: point.netCalories,
    };
  }, [selectedIndex, data]);

  const tooltipData = getTooltipData();

  if (!data || data.length === 0) {
    return null;
  }

  const chart = (
    <Pressable
      ref={chartRef}
      onPress={handleChartTouch}
      onLayout={handleChartLayout}
      style={styles.chartContainer}
      accessibilityLabel="Calorie intake chart"
      accessibilityHint="Tap on bars to see details"
    >
      <BarChart
        data={chartData}
        width={chartWidth}
        height={height}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 0,
          color: (opacity = 1, index?: number) => {
            // Highlight selected bar
            if (index !== undefined && index === selectedIndex) {
              return `rgba(0, 122, 255, 1)`; // Brighter blue
            }
            return color;
          },
          labelColor: () => '#8E8E93',
          barPercentage,
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
    </Pressable>
  );

  return (
    <View style={style}>
      {scrollable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={data.length > 7}
          contentContainerStyle={styles.scrollContent}
        >
          {chart}
        </ScrollView>
      ) : (
        chart
      )}

      {/* Tooltip */}
      <ChartTooltip
        visible={selectedIndex !== null && tooltipData !== null}
        position={tooltipPosition}
        onDismiss={handleDismissTooltip}
        placement="below"
        accessibilityLabel={
          tooltipData
            ? `${tooltipData.date}: ${tooltipData.consumed} calories consumed`
            : undefined
        }
      >
        {tooltipData && <CalorieTooltipContent data={tooltipData} />}
      </ChartTooltip>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    position: 'relative',
  },
  scrollContent: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
});

export default InteractiveBarChart;

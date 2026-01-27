import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TouchableWithoutFeedback,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TOOLTIP_MIN_WIDTH = 160;
const TOOLTIP_MAX_WIDTH = 280;
const SCREEN_PADDING = 16;
const POINTER_SIZE = 8;

export type TooltipPlacement = 'above' | 'below' | 'auto';

export interface ChartTooltipPosition {
  x: number;
  y: number;
}

export interface ChartTooltipProps {
  /** Whether the tooltip is visible */
  visible: boolean;
  /** Position of the data point the tooltip should point to */
  position: ChartTooltipPosition | null;
  /** Preferred placement of the tooltip */
  placement?: TooltipPlacement;
  /** Callback when the tooltip should be dismissed */
  onDismiss: () => void;
  /** Content to display inside the tooltip */
  children: React.ReactNode;
  /** Accessibility label for the entire tooltip */
  accessibilityLabel?: string;
  /** Whether to show the close button */
  showCloseButton?: boolean;
}

/**
 * A reusable tooltip component for interactive charts.
 *
 * Features:
 * - Auto-positioning to avoid screen edges
 * - Smooth fade/scale animations
 * - Haptic feedback on show
 * - Pointer triangle pointing to data point
 * - Close on tap outside or X button
 * - VoiceOver accessibility support
 */
export function ChartTooltip({
  visible,
  position,
  placement = 'auto',
  onDismiss,
  children,
  accessibilityLabel,
  showCloseButton = true,
}: ChartTooltipProps) {
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  // Trigger haptic feedback when tooltip shows
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  useEffect(() => {
    if (visible && position) {
      // Trigger haptic feedback
      triggerHaptic();

      // Animate in
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    } else {
      // Animate out
      opacity.value = withTiming(0, {
        duration: 150,
        easing: Easing.in(Easing.ease),
      });
      scale.value = withTiming(0.95, {
        duration: 150,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [visible, position, opacity, scale, triggerHaptic]);

  // Calculate tooltip position
  const calculatePosition = useCallback(() => {
    if (!position) {
      return { top: 0, left: 0, pointerLeft: 0, pointerOnTop: false };
    }

    const { x, y } = position;

    // Estimate tooltip dimensions (we use min width for calculation)
    const estimatedWidth = TOOLTIP_MIN_WIDTH + 40; // Add padding
    const estimatedHeight = 100; // Approximate height

    // Determine vertical placement
    let tooltipY: number;
    let pointerOnTop = true;

    if (placement === 'above' || (placement === 'auto' && y > estimatedHeight + POINTER_SIZE + 20)) {
      // Place above the data point
      tooltipY = y - estimatedHeight - POINTER_SIZE - 10;
      pointerOnTop = false;
    } else {
      // Place below the data point
      tooltipY = y + POINTER_SIZE + 10;
      pointerOnTop = true;
    }

    // Ensure tooltip doesn't go above screen
    if (tooltipY < SCREEN_PADDING) {
      tooltipY = y + POINTER_SIZE + 10;
      pointerOnTop = true;
    }

    // Calculate horizontal position (centered on data point)
    let tooltipX = x - estimatedWidth / 2;

    // Ensure tooltip doesn't overflow left
    if (tooltipX < SCREEN_PADDING) {
      tooltipX = SCREEN_PADDING;
    }

    // Ensure tooltip doesn't overflow right
    if (tooltipX + estimatedWidth > SCREEN_WIDTH - SCREEN_PADDING) {
      tooltipX = SCREEN_WIDTH - SCREEN_PADDING - estimatedWidth;
    }

    // Calculate pointer position relative to tooltip
    const pointerLeft = Math.max(
      POINTER_SIZE + 8,
      Math.min(x - tooltipX, estimatedWidth - POINTER_SIZE - 8)
    );

    return {
      top: tooltipY,
      left: tooltipX,
      pointerLeft,
      pointerOnTop,
    };
  }, [position, placement]);

  const positionData = calculatePosition();

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible || !position) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onDismiss} accessible={false}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                {
                  top: positionData.top,
                  left: positionData.left,
                },
                animatedContainerStyle,
              ]}
              accessible
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              accessibilityLabel={accessibilityLabel}
            >
              {/* Pointer - on top */}
              {positionData.pointerOnTop && (
                <View
                  style={[
                    styles.pointer,
                    styles.pointerTop,
                    { left: positionData.pointerLeft - POINTER_SIZE },
                  ]}
                />
              )}

              {/* Content */}
              <View style={styles.content}>
                {children}

                {showCloseButton && (
                  <Pressable
                    onPress={onDismiss}
                    style={styles.closeButton}
                    hitSlop={12}
                    accessibilityLabel="Close tooltip"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={16} color="#8E8E93" />
                  </Pressable>
                )}
              </View>

              {/* Pointer - on bottom */}
              {!positionData.pointerOnTop && (
                <View
                  style={[
                    styles.pointer,
                    styles.pointerBottom,
                    { left: positionData.pointerLeft - POINTER_SIZE },
                  ]}
                />
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    position: 'absolute',
    minWidth: TOOLTIP_MIN_WIDTH,
    maxWidth: TOOLTIP_MAX_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  content: {
    padding: 12,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointer: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: POINTER_SIZE,
    borderRightWidth: POINTER_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pointerTop: {
    top: -POINTER_SIZE,
    borderBottomWidth: POINTER_SIZE,
    borderBottomColor: '#FFFFFF',
  },
  pointerBottom: {
    bottom: -POINTER_SIZE,
    borderTopWidth: POINTER_SIZE,
    borderTopColor: '#FFFFFF',
  },
});

export default ChartTooltip;

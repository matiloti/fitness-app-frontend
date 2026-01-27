import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ChartTooltip } from '../ChartTooltip';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('ChartTooltip', () => {
  const mockOnDismiss = jest.fn();
  const defaultPosition = { x: 100, y: 100 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not visible', () => {
    const { queryByText } = render(
      <ChartTooltip
        visible={false}
        position={defaultPosition}
        onDismiss={mockOnDismiss}
      >
        <Text>Tooltip Content</Text>
      </ChartTooltip>
    );

    expect(queryByText('Tooltip Content')).toBeNull();
  });

  it('renders nothing when position is null', () => {
    const { queryByText } = render(
      <ChartTooltip
        visible={true}
        position={null}
        onDismiss={mockOnDismiss}
      >
        <Text>Tooltip Content</Text>
      </ChartTooltip>
    );

    expect(queryByText('Tooltip Content')).toBeNull();
  });

  it('renders children when visible with valid position', () => {
    const { getByText } = render(
      <ChartTooltip
        visible={true}
        position={defaultPosition}
        onDismiss={mockOnDismiss}
      >
        <Text>Tooltip Content</Text>
      </ChartTooltip>
    );

    expect(getByText('Tooltip Content')).toBeTruthy();
  });

  it('renders close button when showCloseButton is true (default)', () => {
    const { getByLabelText } = render(
      <ChartTooltip
        visible={true}
        position={defaultPosition}
        onDismiss={mockOnDismiss}
      >
        <Text>Content</Text>
      </ChartTooltip>
    );

    expect(getByLabelText('Close tooltip')).toBeTruthy();
  });

  it('hides close button when showCloseButton is false', () => {
    const { queryByLabelText } = render(
      <ChartTooltip
        visible={true}
        position={defaultPosition}
        onDismiss={mockOnDismiss}
        showCloseButton={false}
      >
        <Text>Content</Text>
      </ChartTooltip>
    );

    expect(queryByLabelText('Close tooltip')).toBeNull();
  });

  it('calls onDismiss when close button is pressed', () => {
    const { getByLabelText } = render(
      <ChartTooltip
        visible={true}
        position={defaultPosition}
        onDismiss={mockOnDismiss}
      >
        <Text>Content</Text>
      </ChartTooltip>
    );

    fireEvent.press(getByLabelText('Close tooltip'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('sets accessibility role to alert', () => {
    const { getByRole } = render(
      <ChartTooltip
        visible={true}
        position={defaultPosition}
        onDismiss={mockOnDismiss}
      >
        <Text>Content</Text>
      </ChartTooltip>
    );

    // The tooltip container should have role="alert"
    expect(getByRole('alert')).toBeTruthy();
  });

  it('applies custom accessibilityLabel', () => {
    const { getByLabelText } = render(
      <ChartTooltip
        visible={true}
        position={defaultPosition}
        onDismiss={mockOnDismiss}
        accessibilityLabel="Weight: 185 lbs"
      >
        <Text>Content</Text>
      </ChartTooltip>
    );

    expect(getByLabelText('Weight: 185 lbs')).toBeTruthy();
  });

  it('triggers haptic feedback when becoming visible', async () => {
    const Haptics = require('expo-haptics');

    const { rerender } = render(
      <ChartTooltip
        visible={false}
        position={defaultPosition}
        onDismiss={mockOnDismiss}
      >
        <Text>Content</Text>
      </ChartTooltip>
    );

    // Now make it visible
    rerender(
      <ChartTooltip
        visible={true}
        position={defaultPosition}
        onDismiss={mockOnDismiss}
      >
        <Text>Content</Text>
      </ChartTooltip>
    );

    await waitFor(() => {
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });
  });
});

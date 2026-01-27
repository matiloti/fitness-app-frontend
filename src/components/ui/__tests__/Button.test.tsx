import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Press Me" onPress={onPressMock} />);

    fireEvent.press(getByText('Press Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Disabled" onPress={onPressMock} disabled />);

    fireEvent.press(getByText('Disabled'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(<Button title="Loading" onPress={onPressMock} loading />);

    // When loading, there's an ActivityIndicator
    const button = getByRole('button');
    fireEvent.press(button);
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders with accessibility role button', () => {
    const { getByRole } = render(<Button title="Accessible" />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('shows disabled accessibility state when disabled', () => {
    const { getByRole } = render(<Button title="Disabled Button" disabled />);
    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input', () => {
  it('renders correctly with label', () => {
    const { getByText } = render(<Input label="Email" placeholder="Enter email" />);
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders placeholder text', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter text" />);
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeMock = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Type here" onChangeText={onChangeMock} />
    );

    fireEvent.changeText(getByPlaceholderText('Type here'), 'New text');
    expect(onChangeMock).toHaveBeenCalledWith('New text');
  });

  it('displays error message when error prop is provided', () => {
    const { getByText } = render(<Input label="Name" error="Name is required" />);
    expect(getByText('Name is required')).toBeTruthy();
  });

  it('displays helper text when helper prop is provided', () => {
    const { getByText } = render(<Input label="Password" helper="Must be 8 characters" />);
    expect(getByText('Must be 8 characters')).toBeTruthy();
  });

  it('toggles password visibility when showPasswordToggle is true', () => {
    const { getByLabelText, getByPlaceholderText } = render(
      <Input placeholder="Password" secureTextEntry showPasswordToggle />
    );

    // Initially password should be hidden
    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);

    // Toggle visibility
    const toggleButton = getByLabelText('Show password');
    fireEvent.press(toggleButton);

    // Password should now be visible
    expect(getByPlaceholderText('Password').props.secureTextEntry).toBe(false);
  });

  it('is disabled when editable is false', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Disabled input" editable={false} />
    );

    const input = getByPlaceholderText('Disabled input');
    expect(input.props.editable).toBe(false);
  });
});

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  showPasswordToggle?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ref?: React.Ref<TextInput>;
}

export function Input({
  label,
  error,
  helper,
  containerStyle,
  inputStyle,
  showPasswordToggle,
  leftIcon,
  rightIcon,
  secureTextEntry,
  editable = true,
  ref,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = !!error;
  const isDisabled = !editable;

  const containerClasses = 'mb-4';

  const inputContainerClasses = [
    'flex-row items-center rounded-lg px-4',
    'min-h-[48px]',
    isDisabled ? 'bg-gray-100' : 'bg-gray-50',
    hasError
      ? 'border-2 border-red-500'
      : isFocused
        ? 'border-2 border-blue-500'
        : 'border border-gray-200',
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'flex-1 py-3 text-base',
    isDisabled ? 'text-gray-400' : 'text-gray-900',
    leftIcon ? 'ml-2' : '',
    rightIcon || showPasswordToggle ? 'mr-2' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View className={containerClasses} style={containerStyle}>
      {label && (
        <Text
          className={`text-sm font-medium mb-2 ${hasError ? 'text-red-500' : 'text-gray-600'}`}
        >
          {label}
        </Text>
      )}
      <View className={inputContainerClasses}>
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          ref={ref}
          className={inputClasses}
          style={inputStyle}
          placeholderTextColor="#9CA3AF"
          editable={editable}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          accessibilityLabel={label}
          accessibilityState={{ disabled: isDisabled }}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}
        {rightIcon && !showPasswordToggle && <View className="ml-2">{rightIcon}</View>}
      </View>
      {(error || helper) && (
        <Text className={`text-xs mt-1 ${hasError ? 'text-red-500' : 'text-gray-500'}`}>
          {error || helper}
        </Text>
      )}
    </View>
  );
}

export default Input;

import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  style?: ViewStyle;
}

export function StepIndicator({ steps, currentStep, style }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center py-4" style={style}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <React.Fragment key={step}>
            {/* Step circle */}
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                isCompleted || isCurrent ? 'bg-blue-500' : 'bg-gray-200'
              }`}
              accessibilityLabel={`Step ${index + 1}: ${step}, ${isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'}`}
            >
              {isCompleted ? (
                <Text className="text-white text-sm font-bold">✓</Text>
              ) : (
                <Text
                  className={`text-sm font-bold ${
                    isCurrent ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {index + 1}
                </Text>
              )}
            </View>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <View
                className={`h-0.5 w-8 mx-1 ${
                  index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default StepIndicator;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutType } from '../../types';
import { WORKOUT_TYPE_CONFIG } from './WorkoutCard';

interface WorkoutTypeSelectorProps {
  selectedType: WorkoutType | null;
  onSelect: (type: WorkoutType) => void;
  style?: object;
}

const WORKOUT_TYPES: WorkoutType[] = [
  'STRENGTH',
  'CARDIO_RUNNING',
  'CARDIO_CYCLING',
  'CARDIO_SWIMMING',
  'HIIT',
  'YOGA',
  'PILATES',
  'SPORTS',
  'WALKING',
  'OTHER',
];

export function WorkoutTypeSelector({
  selectedType,
  onSelect,
  style,
}: WorkoutTypeSelectorProps) {
  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {WORKOUT_TYPES.map((type) => {
          const config = WORKOUT_TYPE_CONFIG[type];
          const isSelected = selectedType === type;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                isSelected && { backgroundColor: config.gradientStart },
              ]}
              onPress={() => onSelect(type)}
              activeOpacity={0.7}
              accessibilityLabel={`${config.label} workout type`}
              accessibilityState={{ selected: isSelected }}
              accessibilityRole="radio"
            >
              <Ionicons
                name={config.icon}
                size={16}
                color={isSelected ? '#FFFFFF' : '#8E8E93'}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Grid version for modal/full screen
export function WorkoutTypeGrid({
  selectedType,
  onSelect,
  style,
}: WorkoutTypeSelectorProps) {
  return (
    <View style={[styles.gridContainer, style]}>
      {WORKOUT_TYPES.map((type) => {
        const config = WORKOUT_TYPE_CONFIG[type];
        const isSelected = selectedType === type;

        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.gridItem,
              isSelected && styles.gridItemSelected,
              isSelected && { borderColor: config.gradientStart },
            ]}
            onPress={() => onSelect(type)}
            activeOpacity={0.7}
            accessibilityLabel={`${config.label} workout type`}
            accessibilityState={{ selected: isSelected }}
            accessibilityRole="radio"
          >
            <View
              style={[
                styles.gridIconContainer,
                { backgroundColor: isSelected ? config.gradientStart : '#F2F2F7' },
              ]}
            >
              <Ionicons
                name={config.icon}
                size={24}
                color={isSelected ? '#FFFFFF' : config.gradientStart}
              />
            </View>
            <Text
              style={[
                styles.gridItemText,
                isSelected && { color: config.gradientStart },
              ]}
              numberOfLines={1}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  // Grid styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  gridItemSelected: {
    borderWidth: 2,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
});

export default WorkoutTypeSelector;

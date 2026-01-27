import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import type { MealType } from '../../types';

interface MealSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (mealType: MealType) => Promise<void>;
  itemName: string;
  itemCalories: number;
}

const MEAL_OPTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: 'BREAKFAST', label: 'Breakfast', icon: 'sunny-outline' },
  { type: 'LUNCH', label: 'Lunch', icon: 'restaurant-outline' },
  { type: 'DINNER', label: 'Dinner', icon: 'moon-outline' },
  { type: 'SNACK', label: 'Snack', icon: 'cafe-outline' },
];

export function MealSelectionModal({
  visible,
  onClose,
  onSelect,
  itemName,
  itemCalories,
}: MealSelectionModalProps) {
  const [selectedMealType, setSelectedMealType] = useState<MealType>('BREAKFAST');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    setIsAdding(true);
    try {
      await onSelect(selectedMealType);
      onClose();
    } catch (error) {
      console.error('Failed to add to meal:', error);
      Alert.alert('Error', 'Failed to add to meal. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }, [selectedMealType, onSelect, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.title}>Add to Meal</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Item Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {itemName}
            </Text>
            <Text style={styles.itemCalories}>
              {Math.round(itemCalories)} kcal
            </Text>
          </View>

          {/* Meal Selection */}
          <Text style={styles.sectionTitle}>Select Meal</Text>
          <View style={styles.mealOptions}>
            {MEAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.mealOption,
                  selectedMealType === option.type && styles.mealOptionSelected,
                ]}
                onPress={() => setSelectedMealType(option.type)}
                accessibilityLabel={option.label}
                accessibilityState={{ selected: selectedMealType === option.type }}
              >
                <Ionicons
                  name={option.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={selectedMealType === option.type ? '#FFFFFF' : '#007AFF'}
                />
                <Text
                  style={[
                    styles.mealOptionText,
                    selectedMealType === option.type && styles.mealOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={isAdding ? 'Adding...' : `Add to ${MEAL_OPTIONS.find(o => o.type === selectedMealType)?.label}`}
              onPress={handleAdd}
              disabled={isAdding}
              fullWidth
            />
          </View>

          {isAdding && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  itemInfo: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    marginBottom: 16,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemCalories: {
    fontSize: 15,
    color: '#8E8E93',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  mealOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  mealOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  mealOptionTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default MealSelectionModal;

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';

interface QuickEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: QuickEntryData) => Promise<void>;
  mealType: string;
}

export interface QuickEntryData {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export function QuickEntryModal({
  visible,
  onClose,
  onSave,
  mealType,
}: QuickEntryModalProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMacros, setShowMacros] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setShowMacros(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSave = useCallback(async () => {
    const caloriesNum = parseInt(calories, 10);

    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this entry.');
      return;
    }

    if (isNaN(caloriesNum) || caloriesNum <= 0) {
      Alert.alert('Invalid Calories', 'Please enter a valid calorie amount.');
      return;
    }

    setIsSaving(true);

    try {
      const data: QuickEntryData = {
        name: name.trim(),
        calories: caloriesNum,
      };

      // Add optional macros if provided
      const proteinNum = parseInt(protein, 10);
      const carbsNum = parseInt(carbs, 10);
      const fatNum = parseInt(fat, 10);

      if (!isNaN(proteinNum) && proteinNum >= 0) {
        data.protein = proteinNum;
      }
      if (!isNaN(carbsNum) && carbsNum >= 0) {
        data.carbs = carbsNum;
      }
      if (!isNaN(fatNum) && fatNum >= 0) {
        data.fat = fatNum;
      }

      await onSave(data);
      handleClose();
    } catch (error) {
      console.error('Failed to save quick entry:', error);
      Alert.alert('Error', 'Failed to save quick entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [name, calories, protein, carbs, fat, onSave, handleClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.title}>Quick Entry</Text>
            <View style={styles.closeButton} />
          </View>

          <Text style={styles.subtitle}>
            Add to {mealType}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Coffee with milk"
                placeholderTextColor="#C7C7CC"
                value={name}
                onChangeText={setName}
                autoCapitalize="sentences"
                autoFocus
              />
            </View>

            {/* Calories Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Calories</Text>
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={[styles.input, styles.inputWithUnitField]}
                  placeholder="0"
                  placeholderTextColor="#C7C7CC"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                />
                <Text style={styles.unit}>kcal</Text>
              </View>
            </View>

            {/* Optional Macros Toggle */}
            <TouchableOpacity
              style={styles.macrosToggle}
              onPress={() => setShowMacros(!showMacros)}
            >
              <Ionicons
                name={showMacros ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color="#8E8E93"
              />
              <Text style={styles.macrosToggleText}>
                {showMacros ? 'Hide' : 'Add'} macros (optional)
              </Text>
            </TouchableOpacity>

            {/* Macros Section */}
            {showMacros && (
              <View style={styles.macrosSection}>
                <View style={styles.macroRow}>
                  <View style={[styles.inputGroup, styles.macroInput]}>
                    <Text style={styles.label}>Protein</Text>
                    <View style={styles.inputWithUnit}>
                      <TextInput
                        style={[styles.input, styles.inputWithUnitField]}
                        placeholder="0"
                        placeholderTextColor="#C7C7CC"
                        value={protein}
                        onChangeText={setProtein}
                        keyboardType="numeric"
                      />
                      <Text style={styles.unit}>g</Text>
                    </View>
                  </View>

                  <View style={[styles.inputGroup, styles.macroInput]}>
                    <Text style={styles.label}>Carbs</Text>
                    <View style={styles.inputWithUnit}>
                      <TextInput
                        style={[styles.input, styles.inputWithUnitField]}
                        placeholder="0"
                        placeholderTextColor="#C7C7CC"
                        value={carbs}
                        onChangeText={setCarbs}
                        keyboardType="numeric"
                      />
                      <Text style={styles.unit}>g</Text>
                    </View>
                  </View>

                  <View style={[styles.inputGroup, styles.macroInput]}>
                    <Text style={styles.label}>Fat</Text>
                    <View style={styles.inputWithUnit}>
                      <TextInput
                        style={[styles.input, styles.inputWithUnitField]}
                        placeholder="0"
                        placeholderTextColor="#C7C7CC"
                        value={fat}
                        onChangeText={setFat}
                        keyboardType="numeric"
                      />
                      <Text style={styles.unit}>g</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={isSaving ? 'Saving...' : 'Add Entry'}
              onPress={handleSave}
              disabled={isSaving || !name.trim() || !calories}
              fullWidth
            />
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '80%',
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
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    color: '#000000',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithUnitField: {
    flex: 1,
  },
  unit: {
    fontSize: 17,
    color: '#8E8E93',
    marginLeft: 8,
    minWidth: 40,
  },
  macrosToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  macrosToggleText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  macrosSection: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: 24,
  },
});

export default QuickEntryModal;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalorieEstimateProps {
  estimatedCalories: number | null;
  actualCalories: number | null;
  useActual: boolean;
  onUseActualChange: (useActual: boolean) => void;
  onActualChange: (calories: number | null) => void;
  isLoading?: boolean;
  style?: object;
}

export function CalorieEstimate({
  estimatedCalories,
  actualCalories,
  useActual,
  onUseActualChange,
  onActualChange,
  isLoading = false,
  style,
}: CalorieEstimateProps) {
  const displayCalories = useActual ? actualCalories : estimatedCalories;

  const handleActualCaloriesChange = (text: string) => {
    const value = parseInt(text, 10);
    if (isNaN(value)) {
      onActualChange(null);
    } else if (value >= 0 && value <= 5000) {
      onActualChange(value);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Estimated Calories Display */}
      <View style={styles.estimatedSection}>
        <View style={styles.estimatedHeader}>
          <View style={styles.estimatedLabelContainer}>
            <Ionicons name="flame" size={16} color="#FF9500" />
            <Text style={styles.estimatedLabel}>Estimated Calories</Text>
          </View>
          {isLoading ? (
            <Text style={styles.loadingText}>Calculating...</Text>
          ) : (
            <Text style={styles.estimatedValue}>
              {estimatedCalories !== null ? `${Math.round(estimatedCalories)} kcal` : '--'}
            </Text>
          )}
        </View>
        <Text style={styles.estimatedHint}>
          Based on your weight and duration
        </Text>
      </View>

      {/* Toggle for Custom Calories */}
      <View style={styles.toggleSection}>
        <View style={styles.toggleLabelContainer}>
          <Text style={styles.toggleLabel}>Use custom calories</Text>
          <Text style={styles.toggleHint}>Override the estimated value</Text>
        </View>
        <Switch
          value={useActual}
          onValueChange={onUseActualChange}
          trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          thumbColor="#FFFFFF"
          accessibilityLabel={useActual ? 'Custom calories enabled' : 'Custom calories disabled'}
          accessibilityHint="Double tap to toggle between estimated and custom calories"
        />
      </View>

      {/* Custom Calories Input */}
      {useActual && (
        <View style={styles.customSection}>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => {
                const current = actualCalories ?? estimatedCalories ?? 0;
                onActualChange(Math.max(0, current - 10));
              }}
              accessibilityLabel="Decrease calories by 10"
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={actualCalories !== null ? actualCalories.toString() : ''}
              onChangeText={handleActualCaloriesChange}
              keyboardType="number-pad"
              placeholder={estimatedCalories ? Math.round(estimatedCalories).toString() : '0'}
              placeholderTextColor="#C7C7CC"
              accessibilityLabel="Custom calories input"
              accessibilityHint="Enter the actual calories burned"
            />

            <Text style={styles.inputUnit}>kcal</Text>

            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => {
                const current = actualCalories ?? estimatedCalories ?? 0;
                onActualChange(Math.min(5000, current + 10));
              }}
              accessibilityLabel="Increase calories by 10"
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryLabel}>Calories to Log</Text>
        <Text style={styles.summaryValue}>
          {displayCalories !== null ? `${Math.round(displayCalories)} kcal` : '--'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  estimatedSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  estimatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  estimatedLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estimatedLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  estimatedValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF9500',
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  estimatedHint: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  toggleHint: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  customSection: {
    padding: 16,
    backgroundColor: '#F2F2F7',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  inputButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    paddingVertical: 12,
  },
  inputUnit: {
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 8,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default CalorieEstimate;

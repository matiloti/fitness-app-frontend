import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RecipeNutrition } from '../../services/recipeService';

interface NutritionSummaryProps {
  nutrition: RecipeNutrition;
  servings?: number;
  showPerServing?: boolean;
  compact?: boolean;
}

export function NutritionSummary({
  nutrition,
  servings = 1,
  showPerServing = true,
  compact = false,
}: NutritionSummaryProps) {
  const displayNutrition = {
    calories: Math.round(nutrition.calories * servings),
    protein: Math.round(nutrition.protein * servings),
    carbs: Math.round(nutrition.carbs * servings),
    fat: Math.round(nutrition.fat * servings),
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactCalories}>{displayNutrition.calories} kcal</Text>
        <Text style={styles.compactMacros}>
          P: {displayNutrition.protein}g | C: {displayNutrition.carbs}g | F: {displayNutrition.fat}g
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showPerServing && (
        <Text style={styles.title}>
          Nutrition {servings !== 1 ? `(${servings} serving${servings > 1 ? 's' : ''})` : 'per Serving'}
        </Text>
      )}
      <View style={styles.grid}>
        <View style={styles.item}>
          <Text style={[styles.value, styles.calorieValue]}>{displayNutrition.calories}</Text>
          <Text style={styles.label}>kcal</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Text style={[styles.value, styles.proteinValue]}>{displayNutrition.protein}g</Text>
          <Text style={styles.label}>Protein</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Text style={[styles.value, styles.carbsValue]}>{displayNutrition.carbs}g</Text>
          <Text style={styles.label}>Carbs</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Text style={[styles.value, styles.fatValue]}>{displayNutrition.fat}g</Text>
          <Text style={styles.label}>Fat</Text>
        </View>
      </View>
    </View>
  );
}

interface NutritionBarProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function NutritionBar({ calories, protein, carbs, fat }: NutritionBarProps) {
  return (
    <View style={styles.barContainer}>
      <Text style={styles.barCalories}>{Math.round(calories)} kcal</Text>
      <View style={styles.barMacros}>
        <Text style={[styles.barMacro, styles.proteinText]}>P: {Math.round(protein)}g</Text>
        <Text style={[styles.barMacro, styles.carbsText]}>C: {Math.round(carbs)}g</Text>
        <Text style={[styles.barMacro, styles.fatText]}>F: {Math.round(fat)}g</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E5EA',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  calorieValue: {
    color: '#007AFF',
  },
  proteinValue: {
    color: '#34C759',
  },
  carbsValue: {
    color: '#5856D6',
  },
  fatValue: {
    color: '#FF3B30',
  },
  label: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactCalories: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  compactMacros: {
    fontSize: 13,
    color: '#8E8E93',
  },
  // Bar styles
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barCalories: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  barMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  barMacro: {
    fontSize: 13,
  },
  proteinText: {
    color: '#34C759',
  },
  carbsText: {
    color: '#5856D6',
  },
  fatText: {
    color: '#FF3B30',
  },
});

export default NutritionSummary;

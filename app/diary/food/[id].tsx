import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFood } from '../../../src/hooks/useFoods';
import { useCreateMeal, useAddMealItem } from '../../../src/hooks/useMeals';
import type { MealType } from '../../../src/types';
import type { Portion } from '../../../src/services/foodService';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

export default function FoodDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    mealType?: MealType;
    date?: string;
    mealId?: string;
  }>();

  const { id, mealType = 'SNACK', date, mealId } = params;
  const mealTypeLabel = MEAL_TYPE_LABELS[mealType] || 'Meal';

  const { data: food, isLoading, error } = useFood(id);

  // State for portion selection
  const [selectedPortion, setSelectedPortion] = useState<Portion | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [customGrams, setCustomGrams] = useState('');
  const [useCustomGrams, setUseCustomGrams] = useState(false);

  // Mutations
  const createMeal = useCreateMeal();
  const addMealItem = useAddMealItem();

  // Calculate nutrition based on selection
  const calculatedNutrition = useMemo(() => {
    if (!food) return null;

    let amountGrams: number;
    if (useCustomGrams) {
      amountGrams = parseFloat(customGrams) || 0;
    } else if (selectedPortion) {
      amountGrams = selectedPortion.amountGrams * (parseFloat(quantity) || 0);
    } else {
      // Default to 100g
      amountGrams = 100 * (parseFloat(quantity) || 0);
    }

    const multiplier = amountGrams / 100;
    return {
      amountGrams,
      calories: Math.round(food.nutrition.caloriesPer100 * multiplier),
      fat: Math.round(food.nutrition.fatPer100 * multiplier * 10) / 10,
      carbs: Math.round(food.nutrition.carbsPer100 * multiplier * 10) / 10,
      protein: Math.round(food.nutrition.proteinPer100 * multiplier * 10) / 10,
      fiber: food.nutrition.fiberPer100
        ? Math.round(food.nutrition.fiberPer100 * multiplier * 10) / 10
        : null,
      sugar: food.nutrition.sugarPer100
        ? Math.round(food.nutrition.sugarPer100 * multiplier * 10) / 10
        : null,
      salt: food.nutrition.saltPer100
        ? Math.round(food.nutrition.saltPer100 * multiplier * 1000) / 1000
        : null,
      saturatedFat: food.nutrition.saturatedFatPer100
        ? Math.round(food.nutrition.saturatedFatPer100 * multiplier * 10) / 10
        : null,
    };
  }, [food, selectedPortion, quantity, customGrams, useCustomGrams]);

  // Initialize selected portion when food loads
  React.useEffect(() => {
    if (food?.portions && food.portions.length > 0 && !selectedPortion) {
      setSelectedPortion(food.portions[0]);
    }
  }, [food, selectedPortion]);

  const handleQuantityChange = useCallback((value: string) => {
    // Allow decimal input
    if (/^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
    }
  }, []);

  const handleCustomGramsChange = useCallback((value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomGrams(value);
    }
  }, []);

  const handleAddToMeal = useCallback(async () => {
    if (!food || !calculatedNutrition) return;

    try {
      let targetMealId = mealId;

      // Create meal if doesn't exist
      if (!targetMealId && date) {
        const newMeal = await createMeal.mutateAsync({
          date,
          mealType,
        });
        targetMealId = newMeal.id;
      }

      if (targetMealId) {
        // Add food item
        await addMealItem.mutateAsync({
          mealId: targetMealId,
          data: {
            type: 'FOOD',
            foodId: food.id,
            quantity: parseFloat(quantity) || 1,
            portionId: useCustomGrams ? undefined : selectedPortion?.id,
          },
        });

        // Success - navigate back to home to refresh meal data
        // Using replace to go directly to home ensures fresh data is loaded
        // and the back navigation stack is clean for adding more food
        router.dismissAll();
      }
    } catch (error) {
      console.error('Failed to add food:', error);
      Alert.alert('Error', 'Failed to add food to meal. Please try again.');
    }
  }, [food, calculatedNutrition, mealId, date, mealType, createMeal, addMealItem, quantity, useCustomGrams, selectedPortion, router]);

  const handleEditFood = useCallback(() => {
    if (food) {
      router.push({
        pathname: '/diary/food/create',
        params: { editId: food.id },
      });
    }
  }, [food, router]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !food) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#FF9500" />
          <Text style={styles.errorTitle}>Food not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: food.name,
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={handleEditFood}>
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Food Info */}
          <View style={styles.infoCard}>
            <Text style={styles.foodName}>{food.name}</Text>
            {food.brand && (
              <Text style={styles.brandName}>{food.brand.name}</Text>
            )}
            {food.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{food.category.name}</Text>
              </View>
            )}
          </View>

          {/* Portion Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portion</Text>

            {/* Custom grams toggle */}
            <TouchableOpacity
              style={[styles.portionOption, useCustomGrams && styles.portionOptionSelected]}
              onPress={() => setUseCustomGrams(true)}
            >
              <View style={styles.portionOptionContent}>
                <Text style={styles.portionOptionLabel}>Custom amount</Text>
                {useCustomGrams && (
                  <View style={styles.customGramsInput}>
                    <TextInput
                      style={styles.gramsInput}
                      value={customGrams}
                      onChangeText={handleCustomGramsChange}
                      keyboardType="decimal-pad"
                      placeholder="100"
                      placeholderTextColor="#C7C7CC"
                    />
                    <Text style={styles.gramsUnit}>
                      {food.metricType === 'MILLILITERS' ? 'ml' : 'g'}
                    </Text>
                  </View>
                )}
              </View>
              {useCustomGrams && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>

            {/* Predefined portions */}
            {food.portions.map((portion) => (
              <TouchableOpacity
                key={portion.id}
                style={[
                  styles.portionOption,
                  !useCustomGrams && selectedPortion?.id === portion.id && styles.portionOptionSelected,
                ]}
                onPress={() => {
                  setSelectedPortion(portion);
                  setUseCustomGrams(false);
                }}
              >
                <View style={styles.portionOptionContent}>
                  <Text style={styles.portionOptionLabel}>{portion.name}</Text>
                  <Text style={styles.portionOptionGrams}>
                    {portion.amountGrams}
                    {food.metricType === 'MILLILITERS' ? 'ml' : 'g'}
                  </Text>
                </View>
                {!useCustomGrams && selectedPortion?.id === portion.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}

            {/* Quantity */}
            {!useCustomGrams && (
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const current = parseFloat(quantity) || 1;
                      setQuantity(Math.max(0.25, current - 0.25).toString());
                    }}
                  >
                    <Ionicons name="remove" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={handleQuantityChange}
                    keyboardType="decimal-pad"
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const current = parseFloat(quantity) || 1;
                      setQuantity((current + 0.25).toString());
                    }}
                  >
                    <Ionicons name="add" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Nutrition Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition</Text>
            <View style={styles.nutritionCard}>
              {/* Main macros */}
              <View style={styles.nutritionHeader}>
                <Text style={styles.nutritionCalories}>
                  {calculatedNutrition?.calories || 0}
                </Text>
                <Text style={styles.nutritionCaloriesUnit}>kcal</Text>
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: '#34C759' }]}>
                    {calculatedNutrition?.protein || 0}g
                  </Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: '#5856D6' }]}>
                    {calculatedNutrition?.carbs || 0}g
                  </Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: '#FF3B30' }]}>
                    {calculatedNutrition?.fat || 0}g
                  </Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>

              {/* Additional nutrients */}
              <View style={styles.nutrientList}>
                {calculatedNutrition?.fiber !== null && (
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Fiber</Text>
                    <Text style={styles.nutrientValue}>
                      {calculatedNutrition?.fiber}g
                    </Text>
                  </View>
                )}
                {calculatedNutrition?.sugar !== null && (
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Sugar</Text>
                    <Text style={styles.nutrientValue}>
                      {calculatedNutrition?.sugar}g
                    </Text>
                  </View>
                )}
                {calculatedNutrition?.saturatedFat !== null && (
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Saturated Fat</Text>
                    <Text style={styles.nutrientValue}>
                      {calculatedNutrition?.saturatedFat}g
                    </Text>
                  </View>
                )}
                {calculatedNutrition?.salt !== null && (
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Salt</Text>
                    <Text style={styles.nutrientValue}>
                      {calculatedNutrition?.salt}g
                    </Text>
                  </View>
                )}
              </View>

              {/* Per 100g reference */}
              <View style={styles.referenceRow}>
                <Text style={styles.referenceText}>
                  Per 100{food.metricType === 'MILLILITERS' ? 'ml' : 'g'}:{' '}
                  {food.nutrition.caloriesPer100} kcal
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom action bar */}
        <View style={styles.actionBar}>
          <View style={styles.actionBarContent}>
            <View style={styles.actionBarInfo}>
              <Text style={styles.actionBarCalories}>
                {calculatedNutrition?.calories || 0} kcal
              </Text>
              <Text style={styles.actionBarAmount}>
                {calculatedNutrition?.amountGrams?.toFixed(1) || 0}
                {food.metricType === 'MILLILITERS' ? 'ml' : 'g'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.addButton,
                (createMeal.isPending || addMealItem.isPending) && styles.addButtonDisabled,
              ]}
              onPress={handleAddToMeal}
              disabled={createMeal.isPending || addMealItem.isPending}
            >
              {createMeal.isPending || addMealItem.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>Add to {mealTypeLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  foodName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  portionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  portionOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  portionOptionContent: {
    flex: 1,
  },
  portionOptionLabel: {
    fontSize: 17,
    color: '#000',
  },
  portionOptionGrams: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  customGramsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  gramsInput: {
    width: 80,
    height: 36,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 17,
    color: '#000',
  },
  gramsUnit: {
    fontSize: 15,
    color: '#8E8E93',
    marginLeft: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quantityLabel: {
    fontSize: 17,
    color: '#000',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 60,
    height: 36,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  nutritionCalories: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
  },
  nutritionCaloriesUnit: {
    fontSize: 17,
    color: '#8E8E93',
    marginLeft: 4,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    marginBottom: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  macroLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  nutrientList: {
    gap: 8,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutrientLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  nutrientValue: {
    fontSize: 15,
    color: '#000',
  },
  referenceRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  referenceText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  actionBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingBottom: 16,
  },
  actionBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionBarInfo: {
    flex: 1,
  },
  actionBarCalories: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  actionBarAmount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe, useDeleteRecipe } from '../../src/hooks/useRecipes';
import { useCreateMeal, useAddMealItem } from '../../src/hooks/useMeals';
import { getDateString } from '../../src/hooks/useDays';
import {
  NutritionSummary,
  IngredientList,
  StepList,
} from '../../src/components/recipes';
import { MealSelectionModal } from '../../src/components/diary';
import { SegmentedControl } from '../../src/components/ui';
import type { MealType } from '../../src/types';

type TabType = 'ingredients' | 'instructions';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('ingredients');
  const [servings, setServings] = useState(1);
  const [showMealSelection, setShowMealSelection] = useState(false);

  const { data: recipe, isLoading, error } = useRecipe(id);
  const deleteRecipe = useDeleteRecipe();
  const createMeal = useCreateMeal();
  const addMealItem = useAddMealItem();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    router.push(`/recipes/edit/${id}`);
  }, [router, id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe.mutateAsync(id!);
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete recipe. Please try again.');
            }
          },
        },
      ]
    );
  }, [recipe, deleteRecipe, id, router]);

  const handleAddToMeal = useCallback(() => {
    setShowMealSelection(true);
  }, []);

  const handleMealSelected = useCallback(async (mealType: MealType) => {
    if (!recipe || !id) return;

    const today = getDateString();

    // Create meal for today with selected meal type
    const meal = await createMeal.mutateAsync({
      date: today,
      mealType,
    });

    // Add recipe to the meal with selected servings
    await addMealItem.mutateAsync({
      mealId: meal.id,
      data: {
        type: 'RECIPE',
        recipeId: id,
        servings,
      },
    });

    Alert.alert('Success', `${recipe.name} added to ${mealType.toLowerCase()}.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [recipe, id, servings, createMeal, addMealItem, router]);

  const incrementServings = useCallback(() => {
    if (servings < 10) {
      setServings((s) => s + 1);
    }
  }, [servings]);

  const decrementServings = useCallback(() => {
    if (servings > 1) {
      setServings((s) => s - 1);
    }
  }, [servings]);

  const totalNutrition = useMemo(() => {
    if (!recipe) return null;
    return {
      calories: recipe.nutritionPerServing.calories * servings,
      protein: recipe.nutritionPerServing.protein * servings,
      carbs: recipe.nutritionPerServing.carbs * servings,
      fat: recipe.nutritionPerServing.fat * servings,
    };
  }, [recipe, servings]);

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hr`;
    return `${hours} hr ${remainingMinutes} min`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Could not load recipe</Text>
          <Text style={styles.errorSubtitle}>
            Please check your connection and try again
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDelete}
            accessibilityLabel="Delete recipe"
          >
            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEdit}
            accessibilityLabel="Edit recipe"
          >
            <Ionicons name="pencil" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant" size={48} color="#8E8E93" />
          </View>
        </View>

        {/* Recipe Info */}
        <View style={styles.infoSection}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          {recipe.description && (
            <Text style={styles.recipeDescription}>{recipe.description}</Text>
          )}

          {/* Quick Info */}
          <View style={styles.quickInfoContainer}>
            <View style={styles.quickInfoItem}>
              <Ionicons name="time-outline" size={18} color="#007AFF" />
              <Text style={styles.quickInfoText}>
                {formatDuration(recipe.totalDurationMinutes)}
              </Text>
            </View>
            <View style={styles.quickInfoDivider} />
            <View style={styles.quickInfoItem}>
              <Ionicons name="restaurant-outline" size={18} color="#007AFF" />
              <Text style={styles.quickInfoText}>
                {recipe.totalServings} serving{recipe.totalServings !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Nutrition Summary */}
          <NutritionSummary
            nutrition={recipe.nutritionPerServing}
            servings={1}
            showPerServing
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <SegmentedControl
            options={[
              { value: 'ingredients', label: `Ingredients (${recipe.ingredients.length})` },
              { value: 'instructions', label: `Steps (${recipe.steps.length})` },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as TabType)}
          />
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'ingredients' ? (
            <IngredientList ingredients={recipe.ingredients} showCalories />
          ) : (
            <StepList steps={recipe.steps} />
          )}
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <View style={styles.servingsRow}>
          <Text style={styles.servingsLabel}>Servings:</Text>
          <View style={styles.servingsStepper}>
            <TouchableOpacity
              style={[styles.stepperButton, servings <= 1 && styles.stepperButtonDisabled]}
              onPress={decrementServings}
              disabled={servings <= 1}
            >
              <Ionicons
                name="remove"
                size={20}
                color={servings <= 1 ? '#C7C7CC' : '#007AFF'}
              />
            </TouchableOpacity>
            <Text style={styles.servingsValue}>{servings}</Text>
            <TouchableOpacity
              style={[styles.stepperButton, servings >= 10 && styles.stepperButtonDisabled]}
              onPress={incrementServings}
              disabled={servings >= 10}
            >
              <Ionicons
                name="add"
                size={20}
                color={servings >= 10 ? '#C7C7CC' : '#007AFF'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addToMealButton} onPress={handleAddToMeal}>
          <Text style={styles.addToMealText}>Add to Meal</Text>
          {totalNutrition && (
            <Text style={styles.addToMealCalories}>
              ({Math.round(totalNutrition.calories)} kcal total)
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Meal Selection Modal */}
      <MealSelectionModal
        visible={showMealSelection}
        onClose={() => setShowMealSelection(false)}
        onSelect={handleMealSelected}
        itemName={recipe.name}
        itemCalories={totalNutrition?.calories ?? 0}
      />
    </SafeAreaView>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  retryText: {
    fontSize: 17,
    color: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  imageContainer: {
    width: '100%',
    height: 240,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    padding: 16,
    gap: 12,
  },
  recipeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  recipeDescription: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  quickInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
  },
  quickInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickInfoText: {
    fontSize: 15,
    color: '#000',
  },
  quickInfoDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E5EA',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabContent: {
    padding: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 34,
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  servingsLabel: {
    fontSize: 17,
    color: '#000',
  },
  servingsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 4,
  },
  stepperButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  stepperButtonDisabled: {
    opacity: 0.5,
  },
  servingsValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    minWidth: 32,
    textAlign: 'center',
  },
  addToMealButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addToMealText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addToMealCalories: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useRecipe,
  useUpdateRecipe,
  useDeleteIngredient,
  useDeleteStep,
} from '../../../src/hooks/useRecipes';
import { NutritionBar } from '../../../src/components/recipes';
import type { RecipeIngredient, RecipeStep } from '../../../src/services/recipeService';

export default function EditRecipeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: recipe, isLoading } = useRecipe(id);
  const updateRecipe = useUpdateRecipe();
  const deleteIngredient = useDeleteIngredient();
  const deleteStep = useDeleteStep();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(4);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with recipe data
  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setDescription(recipe.description || '');
      setServings(recipe.totalServings);
    }
  }, [recipe]);

  // Track changes
  useEffect(() => {
    if (recipe) {
      const changed =
        name !== recipe.name ||
        description !== (recipe.description || '') ||
        servings !== recipe.totalServings;
      setHasChanges(changed);
    }
  }, [name, description, servings, recipe]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [router, hasChanges]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter a recipe name.');
      return;
    }

    try {
      await updateRecipe.mutateAsync({
        id: id!,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          totalServings: servings,
        },
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to update recipe. Please try again.');
    }
  }, [id, name, description, servings, updateRecipe, router]);

  const handleAddIngredient = useCallback(() => {
    router.push({
      pathname: '/recipes/add-ingredient',
      params: {
        mode: 'edit',
        recipeId: id,
      },
    });
  }, [router, id]);

  const handleRemoveIngredient = useCallback(
    (ingredientId: number) => {
      if (recipe && recipe.ingredients.length <= 1) {
        Alert.alert(
          'Cannot Remove',
          'A recipe must have at least one ingredient.'
        );
        return;
      }

      Alert.alert('Remove Ingredient?', 'This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteIngredient.mutate({ recipeId: id!, ingredientId });
          },
        },
      ]);
    },
    [recipe, deleteIngredient, id]
  );

  const handleAddStep = useCallback(() => {
    router.push({
      pathname: '/recipes/add-step',
      params: {
        mode: 'edit',
        recipeId: id,
      },
    });
  }, [router, id]);

  const handleRemoveStep = useCallback(
    (stepId: number) => {
      Alert.alert('Remove Step?', 'This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteStep.mutate({ recipeId: id!, stepId });
          },
        },
      ]);
    },
    [deleteStep, id]
  );

  const incrementServings = useCallback(() => {
    if (servings < 50) {
      setServings((s) => s + 1);
    }
  }, [servings]);

  const decrementServings = useCallback(() => {
    if (servings > 1) {
      setServings((s) => s - 1);
    }
  }, [servings]);

  // Calculate nutrition per serving based on new servings
  const nutritionPerServing = useMemo(() => {
    if (!recipe) return null;
    const totalNutrition = recipe.nutritionTotal;
    return {
      calories: totalNutrition.calories / servings,
      protein: totalNutrition.protein / servings,
      carbs: totalNutrition.carbs / servings,
      fat: totalNutrition.fat / servings,
    };
  }, [recipe, servings]);

  if (isLoading || !recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Recipe</Text>
          <TouchableOpacity
            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || updateRecipe.isPending}
          >
            <Text
              style={[styles.saveText, !hasChanges && styles.saveTextDisabled]}
            >
              {updateRecipe.isPending ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Recipe Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter recipe name"
                  placeholderTextColor="#C7C7CC"
                  maxLength={200}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional description"
                  placeholderTextColor="#C7C7CC"
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Servings *</Text>
                <View style={styles.stepper}>
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
                  <Text style={styles.stepperValue}>{servings}</Text>
                  <TouchableOpacity
                    style={[styles.stepperButton, servings >= 50 && styles.stepperButtonDisabled]}
                    onPress={incrementServings}
                    disabled={servings >= 50}
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={servings >= 50 ? '#C7C7CC' : '#007AFF'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Ingredients ({recipe.ingredients.length})
              </Text>
              <TouchableOpacity
                style={styles.addSectionButton}
                onPress={handleAddIngredient}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addSectionText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {recipe.ingredients.map((ingredient, index) => (
                <React.Fragment key={ingredient.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <IngredientRow
                    ingredient={ingredient}
                    onRemove={() => handleRemoveIngredient(ingredient.id)}
                    canRemove={recipe.ingredients.length > 1}
                  />
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Steps Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Cooking Steps ({recipe.steps.length})
              </Text>
              <TouchableOpacity
                style={styles.addSectionButton}
                onPress={handleAddStep}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addSectionText}>Add</Text>
              </TouchableOpacity>
            </View>

            {recipe.steps.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="list-outline" size={32} color="#C7C7CC" />
                <Text style={styles.emptyText}>No cooking steps</Text>
                <Text style={styles.emptySubtext}>Steps are optional</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {recipe.steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <StepRow
                      step={step}
                      onRemove={() => handleRemoveStep(step.id)}
                    />
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>

          {/* Nutrition Preview */}
          {nutritionPerServing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition per Serving</Text>
              <View style={styles.nutritionCard}>
                <View style={styles.nutritionHeader}>
                  <Ionicons name="calculator" size={20} color="#007AFF" />
                  <Text style={styles.nutritionHeaderText}>
                    Calculated from ingredients
                  </Text>
                </View>
                <NutritionBar
                  calories={nutritionPerServing.calories}
                  protein={nutritionPerServing.protein}
                  carbs={nutritionPerServing.carbs}
                  fat={nutritionPerServing.fat}
                />
              </View>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface IngredientRowProps {
  ingredient: RecipeIngredient;
  onRemove: () => void;
  canRemove: boolean;
}

function IngredientRow({ ingredient, onRemove, canRemove }: IngredientRowProps) {
  const amountDisplay = ingredient.portion
    ? `${ingredient.quantity} x ${ingredient.portion.name}`
    : `${Math.round(ingredient.amountGrams)}${ingredient.food.metricType === 'GRAMS' ? 'g' : 'ml'}`;

  return (
    <View style={styles.ingredientRow}>
      <View style={styles.ingredientContent}>
        <Text style={styles.ingredientName} numberOfLines={1}>
          {ingredient.food.name}
        </Text>
        <Text style={styles.ingredientDetails}>
          {amountDisplay} | {Math.round(ingredient.nutrition.calories)} kcal
        </Text>
      </View>
      {canRemove && (
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface StepRowProps {
  step: RecipeStep;
  onRemove: () => void;
}

function StepRow({ step, onRemove }: StepRowProps) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepDescription} numberOfLines={2}>
          {step.description}
        </Text>
        {step.durationMinutes && step.durationMinutes > 0 && (
          <View style={styles.stepDuration}>
            <Ionicons name="time-outline" size={12} color="#8E8E93" />
            <Text style={styles.stepDurationText}>{step.durationMinutes} min</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </View>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  cancelButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveTextDisabled: {
    color: '#C7C7CC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSectionText: {
    fontSize: 15,
    color: '#007AFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#C7C7CC',
    marginTop: 4,
  },
  inputRow: {
    padding: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 6,
  },
  textInput: {
    fontSize: 17,
    color: '#000',
    padding: 0,
  },
  textArea: {
    minHeight: 60,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignSelf: 'flex-start',
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
  stepperValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    minWidth: 32,
    textAlign: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 17,
    color: '#000',
  },
  ingredientDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  stepDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  stepDurationText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nutritionHeaderText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  bottomPadding: {
    height: 100,
  },
});

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateRecipe } from '../../src/hooks/useRecipes';
import { NutritionBar } from '../../src/components/recipes';
import { useRecipeFormStore } from '../../src/stores/recipeFormStore';

export default function CreateRecipeScreen() {
  const router = useRouter();
  const createRecipe = useCreateRecipe();

  // Use the shared store for form state
  const {
    name,
    description,
    servings,
    ingredients,
    steps,
    setName,
    setDescription,
    setServings,
    removeIngredient,
    removeStep,
    resetForm,
    hasChanges,
  } = useRecipeFormStore();

  // Reset form when component mounts (new recipe)
  useEffect(() => {
    resetForm();
  }, []);

  const handleBack = useCallback(() => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetForm();
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  }, [router, hasChanges, resetForm]);

  const handleSave = useCallback(async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter a recipe name.');
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one ingredient.');
      return;
    }

    try {
      const recipeData = {
        name: name.trim(),
        description: description.trim() || undefined,
        totalServings: servings,
        ingredients: ingredients.map((i) => ({
          foodId: i.foodId,
          portionId: i.portionId,
          quantity: i.quantity,
        })),
        steps: steps.length > 0
          ? steps.map((s) => ({
              description: s.description,
              durationMinutes: s.durationMinutes,
            }))
          : undefined,
      };

      const newRecipe = await createRecipe.mutateAsync(recipeData);
      resetForm();
      router.replace(`/recipes/${newRecipe.id}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to create recipe. Please try again.');
    }
  }, [name, description, servings, ingredients, steps, createRecipe, router, resetForm]);

  const handleAddIngredient = useCallback(() => {
    // Navigate to add ingredient modal
    router.push({
      pathname: '/recipes/add-ingredient',
      params: {
        mode: 'create',
      },
    });
  }, [router]);

  const handleRemoveIngredient = useCallback((tempId: string) => {
    removeIngredient(tempId);
  }, [removeIngredient]);

  const handleAddStep = useCallback(() => {
    // Navigate to add step modal
    router.push({
      pathname: '/recipes/add-step',
      params: {
        mode: 'create',
      },
    });
  }, [router]);

  const handleRemoveStep = useCallback((tempId: string) => {
    removeStep(tempId);
  }, [removeStep]);

  const incrementServings = useCallback(() => {
    if (servings < 50) {
      setServings(servings + 1);
    }
  }, [servings, setServings]);

  const decrementServings = useCallback(() => {
    if (servings > 1) {
      setServings(servings - 1);
    }
  }, [servings, setServings]);

  // Calculate total nutrition
  const totalNutrition = useMemo(() => {
    const total = ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + ing.nutrition.calories,
        protein: acc.protein + ing.nutrition.protein,
        carbs: acc.carbs + ing.nutrition.carbs,
        fat: acc.fat + ing.nutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return total;
  }, [ingredients]);

  const nutritionPerServing = useMemo(() => ({
    calories: totalNutrition.calories / servings,
    protein: totalNutrition.protein / servings,
    carbs: totalNutrition.carbs / servings,
    fat: totalNutrition.fat / servings,
  }), [totalNutrition, servings]);

  const totalDuration = useMemo(() => {
    return steps.reduce((acc, step) => acc + (step.durationMinutes || 0), 0);
  }, [steps]);

  const canSave = name.trim().length > 0 && ingredients.length > 0;

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
          <Text style={styles.headerTitle}>Create Recipe</Text>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave || createRecipe.isPending}
          >
            <Text
              style={[styles.saveText, !canSave && styles.saveTextDisabled]}
            >
              {createRecipe.isPending ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Picker */}
          <TouchableOpacity style={styles.photoPicker}>
            <Ionicons name="camera" size={32} color="#8E8E93" />
            <Text style={styles.photoPickerText}>Add Photo</Text>
          </TouchableOpacity>

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
                Ingredients ({ingredients.length})
              </Text>
              <TouchableOpacity
                style={styles.addSectionButton}
                onPress={handleAddIngredient}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addSectionText}>Add</Text>
              </TouchableOpacity>
            </View>

            {ingredients.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="nutrition-outline" size={32} color="#C7C7CC" />
                <Text style={styles.emptyText}>No ingredients added</Text>
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={handleAddIngredient}
                >
                  <Text style={styles.emptyAddText}>Add Ingredient</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                {ingredients.map((ingredient, index) => (
                  <React.Fragment key={ingredient.tempId}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.ingredientRow}>
                      <View style={styles.ingredientContent}>
                        <Text style={styles.ingredientName} numberOfLines={1}>
                          {ingredient.foodName}
                        </Text>
                        <Text style={styles.ingredientDetails}>
                          {ingredient.portionName
                            ? `${ingredient.quantity} x ${ingredient.portionName}`
                            : `${Math.round(ingredient.amountGrams)}g`}{' '}
                          | {Math.round(ingredient.nutrition.calories)} kcal
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveIngredient(ingredient.tempId)}
                      >
                        <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>

          {/* Steps Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Cooking Steps ({steps.length})
              </Text>
              <TouchableOpacity
                style={styles.addSectionButton}
                onPress={handleAddStep}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addSectionText}>Add</Text>
              </TouchableOpacity>
            </View>

            {steps.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="list-outline" size={32} color="#C7C7CC" />
                <Text style={styles.emptyText}>No cooking steps</Text>
                <Text style={styles.emptySubtext}>Steps are optional</Text>
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={handleAddStep}
                >
                  <Text style={styles.emptyAddText}>Add Step</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                {steps.map((step, index) => (
                  <React.Fragment key={step.tempId}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.stepRow}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepDescription} numberOfLines={2}>
                          {step.description}
                        </Text>
                        {step.durationMinutes && (
                          <View style={styles.stepDuration}>
                            <Ionicons name="time-outline" size={12} color="#8E8E93" />
                            <Text style={styles.stepDurationText}>
                              {step.durationMinutes} min
                            </Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveStep(step.tempId)}
                      >
                        <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>

          {/* Nutrition Preview */}
          {ingredients.length > 0 && (
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
                {totalDuration > 0 && (
                  <Text style={styles.totalDuration}>
                    Total cooking time: {totalDuration} min
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  photoPicker: {
    width: '100%',
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  photoPickerText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
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
  emptyAddButton: {
    marginTop: 12,
  },
  emptyAddText: {
    fontSize: 15,
    color: '#007AFF',
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
  totalDuration: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  bottomPadding: {
    height: 100,
  },
});

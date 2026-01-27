import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateFood, useUpdateFood, useFood, useCategories } from '../../../src/hooks/useFoods';
import type { MetricType } from '../../../src/types';
import type { CreateFoodRequest, CategorySummary } from '../../../src/services/foodService';

interface PortionInput {
  id: string;
  name: string;
  amountGrams: string;
}

export default function CreateFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; editId?: string }>();
  const { name: initialName, editId } = params;

  const isEditing = !!editId;

  // Queries
  const { data: existingFood, isLoading: isLoadingFood } = useFood(editId);
  const { data: categoriesData } = useCategories();

  // Mutations
  const createFood = useCreateFood();
  const updateFood = useUpdateFood();

  // Form state
  const [name, setName] = useState(initialName || '');
  const [brand, setBrand] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [metricType, setMetricType] = useState<MetricType>('GRAMS');

  // Nutrition state
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  const [salt, setSalt] = useState('');

  // Portions state
  const [portions, setPortions] = useState<PortionInput[]>([]);

  // Populate form when editing
  useEffect(() => {
    if (existingFood) {
      setName(existingFood.name);
      setSelectedCategoryId(existingFood.category?.id || null);
      setMetricType(existingFood.metricType);
      setCalories(existingFood.nutrition.caloriesPer100.toString());
      setProtein(existingFood.nutrition.proteinPer100.toString());
      setCarbs(existingFood.nutrition.carbsPer100.toString());
      setFat(existingFood.nutrition.fatPer100.toString());
      if (existingFood.nutrition.fiberPer100) {
        setFiber(existingFood.nutrition.fiberPer100.toString());
      }
      if (existingFood.nutrition.sugarPer100) {
        setSugar(existingFood.nutrition.sugarPer100.toString());
      }
      if (existingFood.nutrition.saturatedFatPer100) {
        setSaturatedFat(existingFood.nutrition.saturatedFatPer100.toString());
      }
      if (existingFood.nutrition.saltPer100) {
        setSalt(existingFood.nutrition.saltPer100.toString());
      }
      setPortions(
        existingFood.portions.map((p) => ({
          id: p.id.toString(),
          name: p.name,
          amountGrams: p.amountGrams.toString(),
        }))
      );
    }
  }, [existingFood]);

  const handleAddPortion = useCallback(() => {
    setPortions((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', amountGrams: '' },
    ]);
  }, []);

  const handleRemovePortion = useCallback((id: string) => {
    setPortions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleUpdatePortion = useCallback(
    (id: string, field: 'name' | 'amountGrams', value: string) => {
      setPortions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  const validateForm = useCallback((): string | null => {
    if (!name.trim()) return 'Name is required';
    if (!calories || parseFloat(calories) < 0) return 'Valid calories required';
    if (!protein || parseFloat(protein) < 0) return 'Valid protein required';
    if (!carbs || parseFloat(carbs) < 0) return 'Valid carbs required';
    if (!fat || parseFloat(fat) < 0) return 'Valid fat required';

    // Validate portions
    for (const portion of portions) {
      if (portion.name && !portion.amountGrams) {
        return 'Portion amount is required if name is provided';
      }
      if (portion.amountGrams && parseFloat(portion.amountGrams) <= 0) {
        return 'Portion amount must be positive';
      }
    }

    return null;
  }, [name, calories, protein, carbs, fat, portions]);

  const handleSave = useCallback(async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    const foodData: CreateFoodRequest = {
      name: name.trim(),
      categoryId: selectedCategoryId || undefined,
      metricType,
      nutrition: {
        caloriesPer100: parseFloat(calories),
        proteinPer100: parseFloat(protein),
        carbsPer100: parseFloat(carbs),
        fatPer100: parseFloat(fat),
        ...(fiber && { fiberPer100: parseFloat(fiber) }),
        ...(sugar && { sugarPer100: parseFloat(sugar) }),
        ...(saturatedFat && { saturatedFatPer100: parseFloat(saturatedFat) }),
        ...(salt && { saltPer100: parseFloat(salt) }),
      },
      portions: portions
        .filter((p) => p.name && p.amountGrams)
        .map((p) => ({
          name: p.name,
          amountGrams: parseFloat(p.amountGrams),
        })),
    };

    try {
      if (isEditing && editId) {
        await updateFood.mutateAsync({
          id: editId,
          data: {
            name: foodData.name,
            categoryId: foodData.categoryId,
            nutrition: foodData.nutrition,
          },
        });
      } else {
        await createFood.mutateAsync(foodData);
      }
      router.back();
    } catch (error) {
      console.error('Failed to save food:', error);
      Alert.alert('Error', 'Failed to save food. Please try again.');
    }
  }, [
    validateForm,
    name,
    selectedCategoryId,
    metricType,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    saturatedFat,
    salt,
    portions,
    isEditing,
    editId,
    updateFood,
    createFood,
    router,
  ]);

  const categories = categoriesData?.categories || [];
  const isLoading = createFood.isPending || updateFood.isPending;

  if (isEditing && isLoadingFood) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Food' : 'Create Food',
          headerBackTitle: 'Cancel',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.saveButton}>Save</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Food Details</Text>
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Chicken Breast"
                  placeholderTextColor="#C7C7CC"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Brand (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="e.g., Generic"
                  placeholderTextColor="#C7C7CC"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        selectedCategoryId === cat.id && styles.categoryChipSelected,
                      ]}
                      onPress={() => setSelectedCategoryId(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategoryId === cat.id && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Metric Type</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      metricType === 'GRAMS' && styles.toggleButtonSelected,
                    ]}
                    onPress={() => setMetricType('GRAMS')}
                  >
                    <Text
                      style={[
                        styles.toggleButtonText,
                        metricType === 'GRAMS' && styles.toggleButtonTextSelected,
                      ]}
                    >
                      Grams
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      metricType === 'MILLILITERS' && styles.toggleButtonSelected,
                    ]}
                    onPress={() => setMetricType('MILLILITERS')}
                  >
                    <Text
                      style={[
                        styles.toggleButtonText,
                        metricType === 'MILLILITERS' && styles.toggleButtonTextSelected,
                      ]}
                    >
                      Milliliters
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Nutrition */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Nutrition per 100{metricType === 'MILLILITERS' ? 'ml' : 'g'}
            </Text>
            <View style={styles.card}>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionInputContainer}>
                  <Text style={styles.nutritionLabel}>Calories *</Text>
                  <View style={styles.nutritionInputRow}>
                    <TextInput
                      style={styles.nutritionInput}
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                    />
                    <Text style={styles.nutritionUnit}>kcal</Text>
                  </View>
                </View>

                <View style={styles.nutritionInputContainer}>
                  <Text style={styles.nutritionLabel}>Protein *</Text>
                  <View style={styles.nutritionInputRow}>
                    <TextInput
                      style={styles.nutritionInput}
                      value={protein}
                      onChangeText={setProtein}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                    />
                    <Text style={styles.nutritionUnit}>g</Text>
                  </View>
                </View>

                <View style={styles.nutritionInputContainer}>
                  <Text style={styles.nutritionLabel}>Carbs *</Text>
                  <View style={styles.nutritionInputRow}>
                    <TextInput
                      style={styles.nutritionInput}
                      value={carbs}
                      onChangeText={setCarbs}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                    />
                    <Text style={styles.nutritionUnit}>g</Text>
                  </View>
                </View>

                <View style={styles.nutritionInputContainer}>
                  <Text style={styles.nutritionLabel}>Fat *</Text>
                  <View style={styles.nutritionInputRow}>
                    <TextInput
                      style={styles.nutritionInput}
                      value={fat}
                      onChangeText={setFat}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                    />
                    <Text style={styles.nutritionUnit}>g</Text>
                  </View>
                </View>
              </View>

              {/* Optional nutrients */}
              <Text style={styles.optionalHeader}>Optional</Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionInputContainer}>
                  <Text style={styles.nutritionLabel}>Fiber</Text>
                  <View style={styles.nutritionInputRow}>
                    <TextInput
                      style={styles.nutritionInput}
                      value={fiber}
                      onChangeText={setFiber}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                    />
                    <Text style={styles.nutritionUnit}>g</Text>
                  </View>
                </View>

                <View style={styles.nutritionInputContainer}>
                  <Text style={styles.nutritionLabel}>Sugar</Text>
                  <View style={styles.nutritionInputRow}>
                    <TextInput
                      style={styles.nutritionInput}
                      value={sugar}
                      onChangeText={setSugar}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                    />
                    <Text style={styles.nutritionUnit}>g</Text>
                  </View>
                </View>

                <View style={styles.nutritionInputContainer}>
                  <Text style={styles.nutritionLabel}>Sat. Fat</Text>
                  <View style={styles.nutritionInputRow}>
                    <TextInput
                      style={styles.nutritionInput}
                      value={saturatedFat}
                      onChangeText={setSaturatedFat}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                    />
                    <Text style={styles.nutritionUnit}>g</Text>
                  </View>
                </View>

                <View style={styles.nutritionInputContainer}>
                  <Text style={styles.nutritionLabel}>Salt</Text>
                  <View style={styles.nutritionInputRow}>
                    <TextInput
                      style={styles.nutritionInput}
                      value={salt}
                      onChangeText={setSalt}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                    />
                    <Text style={styles.nutritionUnit}>g</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Portions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portions (optional)</Text>
            <View style={styles.card}>
              {portions.map((portion) => (
                <View key={portion.id} style={styles.portionRow}>
                  <TextInput
                    style={styles.portionNameInput}
                    value={portion.name}
                    onChangeText={(v) => handleUpdatePortion(portion.id, 'name', v)}
                    placeholder="Portion name"
                    placeholderTextColor="#C7C7CC"
                  />
                  <TextInput
                    style={styles.portionAmountInput}
                    value={portion.amountGrams}
                    onChangeText={(v) =>
                      handleUpdatePortion(portion.id, 'amountGrams', v)
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#C7C7CC"
                  />
                  <Text style={styles.portionUnit}>
                    {metricType === 'MILLILITERS' ? 'ml' : 'g'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemovePortion(portion.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addPortionButton}
                onPress={handleAddPortion}
              >
                <Ionicons name="add-circle" size={20} color="#007AFF" />
                <Text style={styles.addPortionText}>Add Portion</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  saveButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 16,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 17,
    color: '#000',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 15,
    color: '#000',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  toggleButtonSelected: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 15,
    color: '#000',
  },
  toggleButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionInputContainer: {
    width: '47%',
  },
  nutritionLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 6,
  },
  nutritionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  nutritionInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    paddingVertical: 10,
  },
  nutritionUnit: {
    fontSize: 15,
    color: '#8E8E93',
  },
  optionalHeader: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 12,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  portionNameInput: {
    flex: 2,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000',
  },
  portionAmountInput: {
    width: 60,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000',
    textAlign: 'center',
  },
  portionUnit: {
    fontSize: 15,
    color: '#8E8E93',
    width: 20,
  },
  addPortionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  addPortionText: {
    fontSize: 17,
    color: '#007AFF',
  },
  bottomPadding: {
    height: 40,
  },
});

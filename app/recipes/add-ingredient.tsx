import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFoods, useRecentFoods, useFood } from '../../src/hooks/useFoods';
import { useAddIngredient } from '../../src/hooks/useRecipes';
import { FoodCard } from '../../src/components/diary/FoodCard';
import type { FoodListItem, FoodDetail, Portion } from '../../src/services/foodService';

type ScreenState = 'search' | 'portion';

export default function AddIngredientScreen() {
  const router = useRouter();
  const { mode, recipeId } = useLocalSearchParams<{
    mode: 'create' | 'edit';
    recipeId?: string;
  }>();

  const [screenState, setScreenState] = useState<ScreenState>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [selectedPortionId, setSelectedPortionId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Queries
  const { data: recentFoods, isLoading: loadingRecent } = useRecentFoods();
  const { data: searchResults, isLoading: loadingSearch } = useFoods(
    { q: searchQuery, size: 30 },
    searchQuery.length >= 2
  );
  const { data: selectedFood, isLoading: loadingFood } = useFood(
    selectedFoodId ?? undefined
  );

  const addIngredient = useAddIngredient();

  const handleBack = useCallback(() => {
    if (screenState === 'portion') {
      setScreenState('search');
      setSelectedFoodId(null);
      setSelectedPortionId(null);
      setQuantity(1);
    } else {
      router.back();
    }
  }, [screenState, router]);

  const handleFoodSelect = useCallback((food: FoodListItem) => {
    setSelectedFoodId(food.id);
    setScreenState('portion');
  }, []);

  const handlePortionSelect = useCallback((portionId: number | null) => {
    setSelectedPortionId(portionId);
  }, []);

  const handleQuantityChange = useCallback((delta: number) => {
    setQuantity((prev) => Math.max(0.5, Math.min(100, prev + delta)));
  }, []);

  const handleAddIngredient = useCallback(async () => {
    if (!selectedFoodId) return;

    if (mode === 'edit' && recipeId) {
      try {
        await addIngredient.mutateAsync({
          recipeId,
          data: {
            foodId: selectedFoodId,
            portionId: selectedPortionId ?? undefined,
            quantity,
          },
        });
        router.back();
      } catch (err) {
        console.error('Failed to add ingredient:', err);
      }
    } else {
      // For create mode, we would pass back the data
      // This would be handled via params or state management
      router.back();
    }
  }, [selectedFoodId, selectedPortionId, quantity, mode, recipeId, addIngredient, router]);

  // Calculate nutrition
  const calculatedNutrition = useMemo(() => {
    if (!selectedFood) return null;

    let amountGrams: number;
    if (selectedPortionId) {
      const portion = selectedFood.portions?.find((p) => p.id === selectedPortionId);
      amountGrams = portion ? portion.amountGrams * quantity : quantity;
    } else {
      amountGrams = quantity;
    }

    const multiplier = amountGrams / 100;
    return {
      calories: selectedFood.nutrition.caloriesPer100 * multiplier,
      protein: selectedFood.nutrition.proteinPer100 * multiplier,
      carbs: selectedFood.nutrition.carbsPer100 * multiplier,
      fat: selectedFood.nutrition.fatPer100 * multiplier,
      amountGrams,
    };
  }, [selectedFood, selectedPortionId, quantity]);

  const foods = searchQuery.length >= 2 ? searchResults?.content : recentFoods?.foods;
  const isLoading = searchQuery.length >= 2 ? loadingSearch : loadingRecent;

  if (screenState === 'portion' && selectedFood) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Ingredient</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.portionContent}
        >
          <Text style={styles.foodName}>{selectedFood.name}</Text>

          {/* Portion Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portion</Text>
            <View style={styles.portionList}>
              {/* Grams/ml option */}
              <TouchableOpacity
                style={[
                  styles.portionOption,
                  selectedPortionId === null && styles.portionOptionSelected,
                ]}
                onPress={() => handlePortionSelect(null)}
              >
                <View style={styles.radioButton}>
                  {selectedPortionId === null && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.portionName}>
                  {selectedFood.metricType === 'GRAMS' ? 'Grams (g)' : 'Milliliters (ml)'}
                </Text>
              </TouchableOpacity>

              {/* Portion options */}
              {selectedFood.portions?.map((portion) => (
                <TouchableOpacity
                  key={portion.id}
                  style={[
                    styles.portionOption,
                    selectedPortionId === portion.id && styles.portionOptionSelected,
                  ]}
                  onPress={() => handlePortionSelect(portion.id)}
                >
                  <View style={styles.radioButton}>
                    {selectedPortionId === portion.id && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.portionInfo}>
                    <Text style={styles.portionName}>{portion.name}</Text>
                    <Text style={styles.portionGrams}>({portion.amountGrams}g)</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quantity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(-0.5)}
              >
                <Ionicons name="remove" size={24} color="#007AFF" />
              </TouchableOpacity>
              <View style={styles.quantityValue}>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Text style={styles.quantityUnit}>
                  {selectedPortionId === null
                    ? selectedFood.metricType === 'GRAMS'
                      ? 'g'
                      : 'ml'
                    : 'x'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(0.5)}
              >
                <Ionicons name="add" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nutrition Preview */}
          {calculatedNutrition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition</Text>
              <View style={styles.nutritionPreview}>
                <Text style={styles.nutritionTotal}>
                  Total: {Math.round(calculatedNutrition.amountGrams)}
                  {selectedFood.metricType === 'GRAMS' ? 'g' : 'ml'} |{' '}
                  {Math.round(calculatedNutrition.calories)} kcal
                </Text>
                <View style={styles.macroRow}>
                  <Text style={styles.macroText}>
                    P: {Math.round(calculatedNutrition.protein)}g
                  </Text>
                  <Text style={styles.macroText}>
                    C: {Math.round(calculatedNutrition.carbs)}g
                  </Text>
                  <Text style={styles.macroText}>
                    F: {Math.round(calculatedNutrition.fat)}g
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Add Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddIngredient}
            disabled={addIngredient.isPending}
          >
            <Text style={styles.addButtonText}>
              {addIngredient.isPending ? 'Adding...' : 'Add Ingredient'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <Text style={styles.closeText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Ingredient</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Food List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={foods as FoodListItem[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FoodCard
              food={item}
              onPress={() => handleFoodSelect(item)}
              showChevron
            />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            !searchQuery && foods && foods.length > 0 ? (
              <Text style={styles.listHeader}>Recent</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>
                {searchQuery.length >= 2
                  ? 'No foods found'
                  : 'Search for foods to add'}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  closeButton: {
    minWidth: 60,
  },
  closeText: {
    fontSize: 17,
    color: '#007AFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    minWidth: 60,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  listHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  // Portion screen
  scrollView: {
    flex: 1,
  },
  portionContent: {
    padding: 16,
  },
  foodName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  portionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  portionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  portionOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  portionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portionName: {
    fontSize: 17,
    color: '#000',
  },
  portionGrams: {
    fontSize: 15,
    color: '#8E8E93',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    alignItems: 'center',
    marginHorizontal: 32,
  },
  quantityText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
  },
  quantityUnit: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  nutritionPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  nutritionTotal: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 16,
  },
  macroText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  footer: {
    padding: 16,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

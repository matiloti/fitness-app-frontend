import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFoods, useRecentFoods } from '../../src/hooks/useFoods';
import { useCreateMeal, useAddMealItem } from '../../src/hooks/useMeals';
import { FoodCard, FoodSearchResult, QuickEntryModal } from '../../src/components/diary';
import type { QuickEntryData } from '../../src/components/diary';
import type { MealType } from '../../src/types';
import type { FoodListItem, RecentFood } from '../../src/services/foodService';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mealType?: MealType;
    date?: string;
    mealId?: string;
  }>();

  const { mealType = 'SNACK', date, mealId } = params;
  const mealTypeLabel = MEAL_TYPE_LABELS[mealType] || 'Meal';

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showQuickEntry, setShowQuickEntry] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const { data: recentFoods, isLoading: isLoadingRecent } = useRecentFoods(10);
  const { data: searchResults, isLoading: isSearching } = useFoods(
    debouncedQuery.length >= 2 ? { q: debouncedQuery, size: 20 } : {}
  );

  // Mutations
  const createMeal = useCreateMeal();
  const addMealItem = useAddMealItem();

  const isSearchMode = debouncedQuery.length >= 2;

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const handleFoodPress = useCallback((food: FoodListItem | RecentFood) => {
    // Navigate to food detail
    router.push({
      pathname: `/diary/food/${food.id}`,
      params: { mealType, date, mealId },
    });
  }, [router, mealType, date, mealId]);

  const handleQuickAdd = useCallback(async (food: RecentFood) => {
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
        // Add food with default portion
        await addMealItem.mutateAsync({
          mealId: targetMealId,
          data: {
            type: 'FOOD',
            foodId: food.id,
            quantity: 1,
            portionId: food.defaultPortion?.id,
          },
        });

        // Go back
        router.back();
      }
    } catch (error) {
      console.error('Failed to quick add food:', error);
    }
  }, [mealId, date, mealType, createMeal, addMealItem, router]);

  const handleCreateFood = useCallback(() => {
    router.push({
      pathname: '/diary/food/create',
      params: { name: searchQuery },
    });
  }, [router, searchQuery]);

  const handleQuickEntry = useCallback(() => {
    setShowQuickEntry(true);
  }, []);

  const handleQuickEntrySave = useCallback(async (data: QuickEntryData) => {
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
      // Add quick entry to meal
      await addMealItem.mutateAsync({
        mealId: targetMealId,
        data: {
          type: 'QUICK_ENTRY',
          name: data.name,
          nutrition: {
            calories: data.calories,
            fat: data.fat,
            carbs: data.carbs,
            protein: data.protein,
          },
        },
      });

      // Go back
      router.back();
    }
  }, [mealId, date, mealType, createMeal, addMealItem, router]);

  const handleScanBarcode = useCallback(() => {
    // TODO: Open barcode scanner
    console.log('Open barcode scanner');
  }, []);

  // Render item
  const renderSearchResult = useCallback(
    ({ item }: { item: FoodListItem }) => (
      <FoodSearchResult
        food={item}
        onPress={() => handleFoodPress(item)}
        searchQuery={debouncedQuery}
      />
    ),
    [handleFoodPress, debouncedQuery]
  );

  const renderRecentFood = useCallback(
    ({ item }: { item: RecentFood }) => (
      <View style={styles.recentFoodItem}>
        <FoodCard
          food={item}
          onPress={() => handleFoodPress(item)}
          onQuickAdd={() => handleQuickAdd(item)}
          showBrand={false}
          showCategory={false}
          showChevron={false}
          compact
        />
      </View>
    ),
    [handleFoodPress, handleQuickAdd]
  );

  const keyExtractor = useCallback((item: FoodListItem | RecentFood) => item.id, []);

  // Empty state for search
  const EmptySearchState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="search" size={48} color="#C7C7CC" />
        <Text style={styles.emptyTitle}>No results for "{debouncedQuery}"</Text>
        <Text style={styles.emptySubtitle}>
          Try a different search term or create a new food
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateFood}>
          <Text style={styles.createButtonText}>Create "{searchQuery}"</Text>
        </TouchableOpacity>
      </View>
    ),
    [debouncedQuery, searchQuery, handleCreateFood]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: `Add to ${mealTypeLabel}`,
          headerBackTitle: 'Back',
          headerSearchBarOptions: undefined,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="never"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanBarcode}
            accessibilityLabel="Scan barcode"
          >
            <Ionicons name="barcode-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isSearchMode ? (
          // Search results
          <FlatList
            data={searchResults?.content || []}
            renderItem={renderSearchResult}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : (
                EmptySearchState
              )
            }
            ListFooterComponent={
              searchResults?.content && searchResults.content.length > 0 ? (
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Can't find it?</Text>
                  <TouchableOpacity onPress={handleCreateFood}>
                    <Text style={styles.footerLink}>Create new food</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        ) : (
          // Recent foods and quick actions
          <FlatList
            data={recentFoods?.foods || []}
            renderItem={renderRecentFood}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <>
                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
                  <TouchableOpacity
                    style={styles.quickAction}
                    onPress={handleCreateFood}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="add-circle" size={24} color="#007AFF" />
                    </View>
                    <Text style={styles.quickActionLabel}>Create{'\n'}Food</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickAction}
                    onPress={handleQuickEntry}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="flash" size={24} color="#007AFF" />
                    </View>
                    <Text style={styles.quickActionLabel}>Quick{'\n'}Entry</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickAction}
                    onPress={handleScanBarcode}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="barcode" size={24} color="#007AFF" />
                    </View>
                    <Text style={styles.quickActionLabel}>Scan{'\n'}Barcode</Text>
                  </TouchableOpacity>
                </View>

                {/* Recent section header */}
                {recentFoods?.foods && recentFoods.foods.length > 0 && (
                  <Text style={styles.sectionHeader}>Recent</Text>
                )}
              </>
            }
            ListEmptyComponent={
              isLoadingRecent ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : (
                <View style={styles.emptyRecent}>
                  <Text style={styles.emptyRecentText}>
                    No recently used foods yet.{'\n'}
                    Search or create a food to get started.
                  </Text>
                </View>
              )
            }
          />
        )}

        {/* Quick Entry Modal */}
        <QuickEntryModal
          visible={showQuickEntry}
          onClose={() => setShowQuickEntry(false)}
          onSave={handleQuickEntrySave}
          mealType={mealTypeLabel}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    paddingVertical: 0,
  },
  scanButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 16,
  },
  quickAction: {
    alignItems: 'center',
    width: 90,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
  },
  recentFoodItem: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyRecent: {
    padding: 40,
    alignItems: 'center',
  },
  emptyRecentText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  footerLink: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
});

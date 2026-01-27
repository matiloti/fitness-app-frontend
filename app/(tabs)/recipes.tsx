import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteRecipes } from '../../src/hooks/useRecipes';
import { RecipeCard, RecipeCardSkeleton } from '../../src/components/recipes';
import type { RecipeListItem } from '../../src/services/recipeService';

type ViewMode = 'grid' | 'list';
type SortOption = 'recentlyUsed' | 'name' | 'createdAt';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recentlyUsed', label: 'Recently Used' },
  { value: 'name', label: 'Alphabetical' },
  { value: 'createdAt', label: 'Date Created' },
];

export default function RecipesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recentlyUsed');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteRecipes({
    q: searchQuery || undefined,
    sort: sortBy,
    size: 20,
  });

  const recipes = useMemo(() => {
    return data?.pages.flatMap((page) => page.content) ?? [];
  }, [data]);

  const totalCount = data?.pages[0]?.page.totalElements ?? 0;

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRecipePress = useCallback(
    (recipe: RecipeListItem) => {
      router.push(`/recipes/${recipe.id}`);
    },
    [router]
  );

  const handleCreateRecipe = useCallback(() => {
    router.push('/recipes/create');
  }, [router]);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
    setShowSortMenu(false);
  }, []);

  const renderRecipeItem = useCallback(
    ({ item, index }: { item: RecipeListItem; index: number }) => {
      if (viewMode === 'grid') {
        return (
          <View style={[styles.gridItem, index % 2 === 1 && styles.gridItemRight]}>
            <RecipeCard
              recipe={item}
              variant="grid"
              onPress={() => handleRecipePress(item)}
            />
          </View>
        );
      }
      return (
        <RecipeCard
          recipe={item}
          variant="list"
          onPress={() => handleRecipePress(item)}
        />
      );
    },
    [viewMode, handleRecipePress]
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return null;
    }

    if (searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No recipes found</Text>
          <Text style={styles.emptySubtitle}>
            No recipes found for "{searchQuery}"
          </Text>
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={64} color="#C7C7CC" />
        <Text style={styles.emptyTitle}>No recipes yet</Text>
        <Text style={styles.emptySubtitle}>
          Create your first recipe to easily track home-cooked meals
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateRecipe}>
          <Text style={styles.createButtonText}>Create Your First Recipe</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  const renderSkeletons = () => {
    if (viewMode === 'grid') {
      return (
        <View style={styles.gridContainer}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={[styles.gridItem, i % 2 === 1 && styles.gridItemRight]}>
              <RecipeCardSkeleton variant="grid" />
            </View>
          ))}
        </View>
      );
    }
    return (
      <View>
        {[...Array(4)].map((_, i) => (
          <RecipeCardSkeleton key={i} variant="list" />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recipes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateRecipe}
          accessibilityLabel="Create new recipe"
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Text style={styles.sortText}>
            {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          </Text>
          <Ionicons
            name={showSortMenu ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#007AFF"
          />
        </TouchableOpacity>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
            onPress={() => setViewMode('grid')}
            accessibilityLabel="Grid view"
          >
            <Ionicons
              name="grid"
              size={18}
              color={viewMode === 'grid' ? '#007AFF' : '#8E8E93'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}
            accessibilityLabel="List view"
          >
            <Ionicons
              name="list"
              size={18}
              color={viewMode === 'list' ? '#007AFF' : '#8E8E93'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive,
              ]}
              onPress={() => handleSortChange(option.value)}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={18} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recipe List */}
      {isLoading && !data ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderSkeletons()}
        </ScrollView>
      ) : recipes.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          key={viewMode}
          data={recipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={[
            styles.listContent,
            viewMode === 'grid' && styles.gridListContent,
          ]}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateRecipe}
        accessibilityLabel="Create new recipe"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 15,
    color: '#007AFF',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  sortMenu: {
    position: 'absolute',
    top: 175,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sortOptionActive: {
    backgroundColor: '#F2F2F7',
  },
  sortOptionText: {
    fontSize: 17,
    color: '#000',
  },
  sortOptionTextActive: {
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  gridListContent: {
    paddingHorizontal: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: 16,
  },
  gridItemRight: {
    // Handled by flexbox
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearSearchButton: {
    marginTop: 16,
  },
  clearSearchText: {
    fontSize: 17,
    color: '#007AFF',
  },
  footerLoader: {
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

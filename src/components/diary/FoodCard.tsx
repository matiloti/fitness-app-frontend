import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FoodListItem, RecentFood } from '../../services/foodService';

interface FoodCardProps {
  food: FoodListItem | RecentFood;
  onPress?: () => void;
  onQuickAdd?: () => void;
  showBrand?: boolean;
  showCategory?: boolean;
  showChevron?: boolean;
  selected?: boolean;
  compact?: boolean;
}

export function FoodCard({
  food,
  onPress,
  onQuickAdd,
  showBrand = true,
  showCategory = true,
  showChevron = true,
  selected = false,
  compact = false,
}: FoodCardProps) {
  const isListItem = 'lastUsedAt' in food && 'category' in food;
  const listItem = isListItem ? (food as FoodListItem) : null;
  const recentFood = !isListItem ? (food as RecentFood) : null;

  const calories = listItem
    ? listItem.nutrition.caloriesPer100
    : recentFood?.nutrition.caloriesPer100 || 0;

  const brandName = listItem?.brand?.name || null;
  const categoryName = listItem?.category?.name || null;

  // Build subtitle
  const subtitleParts: string[] = [];
  if (showBrand && brandName) subtitleParts.push(brandName);
  if (showCategory && categoryName) subtitleParts.push(categoryName);
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : 'Generic';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        compact && styles.containerCompact,
        selected && styles.containerSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}, ${subtitle}, ${Math.round(calories)} calories per 100 grams`}
      accessibilityHint="Double tap to view details and add to meal"
    >
      {/* Image placeholder or category icon */}
      <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
        <View style={styles.imagePlaceholder}>
          <Ionicons
            name={getCategoryIcon(categoryName)}
            size={compact ? 20 : 24}
            color="#8E8E93"
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={2}>
          {food.name}
        </Text>
        <Text style={styles.calories}>{Math.round(calories)} kcal per 100g</Text>
        {!compact && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Right side */}
      <View style={styles.rightContainer}>
        {onQuickAdd && (
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={(e) => {
              e.stopPropagation();
              onQuickAdd();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Quick add"
          >
            <Ionicons name="add-circle" size={28} color="#007AFF" />
          </TouchableOpacity>
        )}
        {selected && (
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
        )}
        {showChevron && !selected && !onQuickAdd && (
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        )}
      </View>
    </TouchableOpacity>
  );
}

interface FoodSearchResultProps {
  food: FoodListItem;
  onPress?: () => void;
  searchQuery?: string;
}

export function FoodSearchResult({
  food,
  onPress,
  searchQuery,
}: FoodSearchResultProps) {
  // Highlight matching text
  const highlightText = (text: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      return <Text style={styles.name}>{text}</Text>;
    }

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <Text style={styles.name}>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <Text key={i} style={styles.highlight}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  const brandName = food.brand?.name;
  const calories = food.nutrition.caloriesPer100;

  return (
    <TouchableOpacity
      style={styles.searchResultContainer}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}, ${brandName || 'Generic'}, ${Math.round(calories)} calories per 100 grams`}
    >
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Ionicons
            name={getCategoryIcon(food.category?.name || null)}
            size={24}
            color="#8E8E93"
          />
        </View>
      </View>

      <View style={styles.content}>
        {highlightText(food.name)}
        <Text style={styles.calories}>{Math.round(calories)} kcal per 100g</Text>
        <Text style={styles.subtitle}>{brandName || 'Generic'}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
    </TouchableOpacity>
  );
}

// Helper to get category icon
function getCategoryIcon(categoryName: string | null): keyof typeof Ionicons.glyphMap {
  if (!categoryName) return 'nutrition-outline';

  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    Fruits: 'nutrition',
    Vegetables: 'leaf',
    'Grains & Cereals': 'basket',
    Protein: 'fish',
    Dairy: 'water',
    Beverages: 'cafe',
    Snacks: 'pizza',
    'Condiments & Sauces': 'color-fill',
    'Fats & Oils': 'water',
    'Sweets & Desserts': 'ice-cream',
    'Prepared Foods': 'restaurant',
    Supplements: 'medkit',
  };

  return iconMap[categoryName] || 'nutrition-outline';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    minHeight: 64,
  },
  containerCompact: {
    minHeight: 52,
    padding: 10,
  },
  containerSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  searchResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  imageContainer: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  imageContainerCompact: {
    width: 40,
    height: 40,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    color: '#000',
    marginBottom: 2,
  },
  nameCompact: {
    fontSize: 15,
  },
  highlight: {
    backgroundColor: '#FFE066',
    fontWeight: '600',
  },
  calories: {
    fontSize: 15,
    color: '#8E8E93',
  },
  subtitle: {
    fontSize: 12,
    color: '#AEAEB2',
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAddButton: {
    marginRight: 4,
  },
});

export default FoodCard;

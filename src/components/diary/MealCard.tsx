import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MealType } from '../../types';
import type { MealItem, MealTotals } from '../../services/mealService';

interface MealCardProps {
  mealType: MealType;
  items: MealItem[];
  totals: MealTotals;
  isCheatMeal?: boolean;
  time?: string;
  onPress?: () => void;
  onAddFood?: () => void;
  onMorePress?: () => void;
  onItemPress?: (item: MealItem) => void;
  onItemSwipeDelete?: (itemId: string) => void;
  collapsed?: boolean;
}

const mealConfig: Record<MealType, { icon: keyof typeof Ionicons.glyphMap; label: string; gradientStart: string; gradientEnd: string }> = {
  BREAKFAST: {
    icon: 'sunny',
    label: 'Breakfast',
    gradientStart: '#FFD60A',
    gradientEnd: '#FF9500',
  },
  LUNCH: {
    icon: 'sunny',
    label: 'Lunch',
    gradientStart: '#FF9500',
    gradientEnd: '#FFD60A',
  },
  DINNER: {
    icon: 'moon',
    label: 'Dinner',
    gradientStart: '#AF52DE',
    gradientEnd: '#5856D6',
  },
  SNACK: {
    icon: 'nutrition',
    label: 'Snack',
    gradientStart: '#34C759',
    gradientEnd: '#30D158',
  },
};

function MealItemRow({
  item,
  onPress,
}: {
  item: MealItem;
  onPress?: () => void;
}) {
  const name =
    item.type === 'FOOD'
      ? item.food?.name
      : item.type === 'RECIPE'
        ? item.recipe?.name
        : item.name;

  const portion =
    item.type === 'FOOD' && item.portion
      ? `${item.quantity} x ${item.portion.name}`
      : item.type === 'FOOD' && item.amountGrams
        ? `${item.amountGrams}g`
        : item.type === 'RECIPE'
          ? `${item.servings} serving${item.servings !== 1 ? 's' : ''}`
          : null;

  return (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={onPress}
      accessibilityLabel={`${name}, ${portion || ''}, ${Math.round(item.nutrition.calories)} calories`}
      accessibilityHint="Double tap to view details"
    >
      <View style={styles.itemContent}>
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemName} numberOfLines={2}>
            {name}
          </Text>
          {portion && <Text style={styles.itemPortion}>{portion}</Text>}
        </View>
        <Text style={styles.itemCalories}>
          {Math.round(item.nutrition.calories)} kcal
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function MealCard({
  mealType,
  items,
  totals,
  isCheatMeal = false,
  time,
  onPress,
  onAddFood,
  onMorePress,
  onItemPress,
  collapsed: initialCollapsed = false,
}: MealCardProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const config = mealConfig[mealType];
  const itemCount = items.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => setCollapsed(!collapsed)}
        accessibilityRole="button"
        accessibilityLabel={`${config.label}, ${itemCount} items, ${Math.round(totals.calories)} calories${isCheatMeal ? ', cheat meal' : ''}`}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: config.gradientStart }]}>
            <Ionicons name={config.icon} size={16} color="white" />
          </View>
          <View style={styles.headerTextContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.mealType}>{config.label}</Text>
              {isCheatMeal && (
                <View style={styles.cheatBadge}>
                  <Text style={styles.cheatBadgeText}>Cheat</Text>
                </View>
              )}
            </View>
            <Text style={styles.mealMeta}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
              {time && ` • ${time}`}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.calories}>{Math.round(totals.calories)} kcal</Text>
          <TouchableOpacity
            onPress={onMorePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </Pressable>

      {/* Items list */}
      {!collapsed && (
        <View style={styles.itemsContainer}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items logged</Text>
            </View>
          ) : (
            items.map((item) => (
              <MealItemRow
                key={item.id}
                item={item}
                onPress={() => onItemPress?.(item)}
              />
            ))
          )}

          {/* Add food button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddFood}
            accessibilityLabel={`Add food to ${config.label}`}
          >
            <Ionicons name="add-circle" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Food</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Collapsed state shows expand button */}
      {collapsed && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setCollapsed(false)}
        >
          <Ionicons name="chevron-down" size={16} color="#8E8E93" />
          <Text style={styles.expandText}>
            Show {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealType: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  cheatBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cheatBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mealMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calories: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  itemsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  itemRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    minHeight: 44,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 17,
    color: '#000',
  },
  itemPortion: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  itemCalories: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  emptyState: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  addButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  expandText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});

export default MealCard;

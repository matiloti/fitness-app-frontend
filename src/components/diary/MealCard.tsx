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
  /** When true, shows minimal header with add button visible (for home screen redesign) */
  showHeaderAddButton?: boolean;
}

const mealConfig: Record<MealType, { icon: keyof typeof Ionicons.glyphMap; label: string; gradientStart: string; gradientEnd: string; emptyMessage: string }> = {
  BREAKFAST: {
    icon: 'sunny',
    label: 'Breakfast',
    gradientStart: '#FFD60A',
    gradientEnd: '#FF9500',
    emptyMessage: 'Add your first breakfast',
  },
  LUNCH: {
    icon: 'sunny',
    label: 'Lunch',
    gradientStart: '#FF9500',
    gradientEnd: '#FF6B00',
    emptyMessage: 'Add your first lunch',
  },
  DINNER: {
    icon: 'moon',
    label: 'Dinner',
    gradientStart: '#AF52DE',
    gradientEnd: '#5856D6',
    emptyMessage: 'Add your first dinner',
  },
  SNACK: {
    icon: 'nutrition',
    label: 'Snack',
    gradientStart: '#34C759',
    gradientEnd: '#30D158',
    emptyMessage: 'Add your first snack',
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
  showHeaderAddButton = false,
}: MealCardProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const config = mealConfig[mealType];
  const itemCount = items.length;
  const isEmpty = itemCount === 0;

  // Build accessibility label based on state
  const getAccessibilityLabel = () => {
    if (isEmpty) {
      return `${config.label}, no items logged, zero calories`;
    }
    return `${config.label}, ${itemCount} items, ${Math.round(totals.calories)} calories, ${Math.round(totals.protein)} grams protein, ${Math.round(totals.carbs)} grams carbs, ${Math.round(totals.fat)} grams fat${isCheatMeal ? ', cheat meal' : ''}`;
  };

  const getAccessibilityHint = () => {
    if (isEmpty) {
      return `Double tap to expand. Use add button to log your first ${config.label.toLowerCase()}`;
    }
    return 'Double tap to expand and see items. Swipe right to find add button.';
  };

  // Format macro summary text
  const getMacroSummary = () => {
    if (isEmpty) {
      return config.emptyMessage;
    }
    return `P: ${Math.round(totals.protein)}g  C: ${Math.round(totals.carbs)}g  F: ${Math.round(totals.fat)}g`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => setCollapsed(!collapsed)}
        accessibilityRole="button"
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint={getAccessibilityHint()}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: config.gradientStart }]}>
            <Ionicons name={config.icon} size={18} color="white" />
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
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.calories}>{Math.round(totals.calories)} kcal</Text>
          {showHeaderAddButton ? (
            <TouchableOpacity
              style={styles.headerAddButton}
              onPress={(e) => {
                e.stopPropagation();
                onAddFood?.();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Add food to ${config.label}`}
              accessibilityHint="Opens food search to add items to this meal"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onMorePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </Pressable>

      {/* Summary Row (always visible) */}
      <View style={styles.summaryRow}>
        <Text style={styles.itemCount}>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
          {time && ` • ${time}`}
        </Text>
        <Text style={styles.macroSeparator}> - </Text>
        <Text style={[styles.macroSummary, isEmpty && styles.emptyMacroSummary]}>
          {getMacroSummary()}
        </Text>
      </View>

      {/* Items list */}
      {!collapsed && (
        <View style={styles.itemsContainer}>
          {isEmpty ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{config.emptyMessage}</Text>
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
            accessibilityHint="Opens food search to add items to this meal"
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Food</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Collapsed state shows expand button */}
      {collapsed && itemCount > 0 && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setCollapsed(false)}
          accessibilityRole="button"
          accessibilityLabel={`Show ${itemCount} items`}
        >
          <Ionicons name="chevron-down" size={14} color="#8E8E93" />
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
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  headerAddButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
    marginLeft: 48, // Align with text after icon
  },
  itemCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  macroSeparator: {
    fontSize: 13,
    color: '#C7C7CC',
  },
  macroSummary: {
    fontSize: 13,
    color: '#8E8E93',
  },
  emptyMacroSummary: {
    color: '#C7C7CC',
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
    color: '#C7C7CC',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
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
    paddingVertical: 8,
    minHeight: 44,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  expandText: {
    fontSize: 12,
    color: '#C7C7CC',
  },
});

export default MealCard;

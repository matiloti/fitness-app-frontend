import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RecipeIngredient } from '../../services/recipeService';

interface IngredientListProps {
  ingredients: RecipeIngredient[];
  editable?: boolean;
  onIngredientPress?: (ingredient: RecipeIngredient) => void;
  onDeleteIngredient?: (ingredientId: number) => void;
  showCalories?: boolean;
}

export function IngredientList({
  ingredients,
  editable = false,
  onIngredientPress,
  onDeleteIngredient,
  showCalories = true,
}: IngredientListProps) {
  if (ingredients.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="nutrition-outline" size={32} color="#C7C7CC" />
        <Text style={styles.emptyText}>No ingredients added yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {ingredients.map((ingredient, index) => (
        <IngredientRow
          key={ingredient.id}
          ingredient={ingredient}
          editable={editable}
          onPress={onIngredientPress}
          onDelete={onDeleteIngredient}
          showDivider={index < ingredients.length - 1}
          showCalories={showCalories}
        />
      ))}
    </View>
  );
}

interface IngredientRowProps {
  ingredient: RecipeIngredient;
  editable: boolean;
  onPress?: (ingredient: RecipeIngredient) => void;
  onDelete?: (ingredientId: number) => void;
  showDivider: boolean;
  showCalories: boolean;
}

function IngredientRow({
  ingredient,
  editable,
  onPress,
  onDelete,
  showDivider,
  showCalories,
}: IngredientRowProps) {
  const amountDisplay = ingredient.portion
    ? `${ingredient.quantity} x ${ingredient.portion.name}`
    : `${Math.round(ingredient.amountGrams)}${ingredient.food.metricType === 'GRAMS' ? 'g' : 'ml'}`;

  const content = (
    <View style={[styles.row, showDivider && styles.rowWithDivider]}>
      {editable && (
        <View style={styles.dragHandle}>
          <Ionicons name="reorder-three" size={20} color="#C7C7CC" />
        </View>
      )}

      <View style={styles.checkbox}>
        <View style={styles.checkboxInner} />
      </View>

      <View style={styles.content}>
        <Text style={styles.foodName} numberOfLines={2}>
          {ingredient.food.name}
        </Text>
        <View style={styles.detailsRow}>
          <Text style={styles.amount}>{amountDisplay}</Text>
          {showCalories && (
            <Text style={styles.calories}>
              {Math.round(ingredient.nutrition.calories)} kcal
            </Text>
          )}
        </View>
      </View>

      {editable && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(ingredient.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={`Delete ${ingredient.food.name}`}
        >
          <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress && !editable) {
    return (
      <TouchableOpacity
        onPress={() => onPress(ingredient)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${ingredient.food.name}, ${amountDisplay}, ${Math.round(ingredient.nutrition.calories)} calories`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

interface EditableIngredientItemProps {
  ingredient: RecipeIngredient;
  onEdit: () => void;
  onDelete: () => void;
}

export function EditableIngredientItem({
  ingredient,
  onEdit,
  onDelete,
}: EditableIngredientItemProps) {
  const amountDisplay = ingredient.portion
    ? `${ingredient.quantity} x ${ingredient.portion.name}`
    : `${Math.round(ingredient.amountGrams)}${ingredient.food.metricType === 'GRAMS' ? 'g' : 'ml'}`;

  return (
    <View style={styles.editableRow}>
      <View style={styles.dragHandle}>
        <Ionicons name="reorder-three" size={20} color="#C7C7CC" />
      </View>

      <TouchableOpacity style={styles.editableContent} onPress={onEdit} activeOpacity={0.7}>
        <Text style={styles.foodName} numberOfLines={1}>
          {ingredient.food.name}
        </Text>
        <Text style={styles.editableDetails}>
          {amountDisplay} | {Math.round(ingredient.nutrition.calories)} kcal
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={`Remove ${ingredient.food.name}`}
      >
        <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
  },
  rowWithDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  dragHandle: {
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  foodName: {
    fontSize: 17,
    color: '#000',
    marginBottom: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 15,
    color: '#8E8E93',
  },
  calories: {
    fontSize: 15,
    color: '#8E8E93',
    marginLeft: 8,
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
  },
  // Editable item styles
  editableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  editableContent: {
    flex: 1,
  },
  editableDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
});

export default IngredientList;

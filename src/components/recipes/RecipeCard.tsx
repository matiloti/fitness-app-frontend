import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RecipeListItem } from '../../services/recipeService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface RecipeCardProps {
  recipe: RecipeListItem;
  onPress?: () => void;
  variant?: 'grid' | 'list';
}

export function RecipeCard({ recipe, onPress, variant = 'grid' }: RecipeCardProps) {
  const caloriesPerServing = Math.round(recipe.nutritionPerServing.calories);
  const duration = recipe.totalDurationMinutes
    ? formatDuration(recipe.totalDurationMinutes)
    : null;

  if (variant === 'list') {
    return (
      <TouchableOpacity
        style={styles.listContainer}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${recipe.name}, ${caloriesPerServing} calories per serving${duration ? `, ${duration} cooking time` : ''}, ${recipe.totalServings} servings`}
        accessibilityHint="Double tap to view recipe details"
      >
        <View style={styles.listImage}>
          {recipe.thumbnailUrl ? (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="restaurant" size={24} color="#8E8E93" />
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="restaurant" size={24} color="#8E8E93" />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <Text style={styles.listTitle} numberOfLines={2}>
            {recipe.name}
          </Text>
          <Text style={styles.listCalories}>
            {caloriesPerServing} kcal{duration ? ` | ${duration}` : ''}
          </Text>
          <Text style={styles.listMeta}>
            {recipe.totalServings} serving{recipe.totalServings !== 1 ? 's' : ''} | {recipe.ingredientCount} ingredient{recipe.ingredientCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.gridContainer}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${recipe.name}, ${caloriesPerServing} calories per serving${duration ? `, ${duration} cooking time` : ''}, ${recipe.totalServings} servings`}
      accessibilityHint="Double tap to view recipe details"
    >
      <View style={styles.gridImage}>
        {recipe.thumbnailUrl ? (
          <View style={styles.gridImagePlaceholder}>
            <Ionicons name="restaurant" size={32} color="#8E8E93" />
          </View>
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Ionicons name="restaurant" size={32} color="#8E8E93" />
          </View>
        )}
      </View>

      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {recipe.name}
        </Text>
        <Text style={styles.gridCalories}>{caloriesPerServing} kcal/serving</Text>
        <Text style={styles.gridMeta}>
          {duration ? `${duration} | ` : ''}{recipe.totalServings} serv
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface RecipeCardSkeletonProps {
  variant?: 'grid' | 'list';
}

export function RecipeCardSkeleton({ variant = 'grid' }: RecipeCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <View style={styles.listContainer}>
        <View style={[styles.listImage, styles.skeleton]} />
        <View style={styles.listContent}>
          <View style={[styles.skeletonText, { width: '70%' }]} />
          <View style={[styles.skeletonText, { width: '50%', marginTop: 8 }]} />
          <View style={[styles.skeletonText, { width: '40%', marginTop: 4 }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      <View style={[styles.gridImage, styles.skeleton]} />
      <View style={styles.gridContent}>
        <View style={[styles.skeletonText, { width: '80%' }]} />
        <View style={[styles.skeletonText, { width: '60%', marginTop: 8 }]} />
        <View style={[styles.skeletonText, { width: '50%', marginTop: 4 }]} />
      </View>
    </View>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

const styles = StyleSheet.create({
  // Grid variant
  gridContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gridImage: {
    width: '100%',
    height: 120,
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 20,
  },
  gridCalories: {
    fontSize: 14,
    color: '#8E8E93',
  },
  gridMeta: {
    fontSize: 12,
    color: '#AEAEB2',
    marginTop: 2,
  },
  // List variant
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  listImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  listCalories: {
    fontSize: 15,
    color: '#8E8E93',
  },
  listMeta: {
    fontSize: 13,
    color: '#AEAEB2',
    marginTop: 2,
  },
  // Skeleton
  skeleton: {
    backgroundColor: '#E5E5EA',
  },
  skeletonText: {
    height: 14,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
});

export default RecipeCard;

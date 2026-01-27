import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProgressPhotoTimeline } from '../../types/analytics';

interface PhotoGridProps {
  photos: ProgressPhotoTimeline[];
  onPhotoPress?: (photo: ProgressPhotoTimeline) => void;
  onAddPress?: () => void;
  horizontal?: boolean;
  showDates?: boolean;
  style?: object;
}

export function PhotoGrid({
  photos,
  onPhotoPress,
  onAddPress,
  horizontal = true,
  showDates = true,
  style,
}: PhotoGridProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.horizontalContainer, style]}
        contentContainerStyle={styles.horizontalContent}
      >
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={`${photo.metricsId}-${photo.position}-${index}`}
            style={styles.photoItem}
            onPress={() => onPhotoPress?.(photo)}
            activeOpacity={0.8}
            accessibilityLabel={`Progress photo from ${formatDate(photo.date)}, ${photo.position.toLowerCase()} view`}
            accessibilityHint="Double tap to view full size"
          >
            <Image
              source={{ uri: photo.imageUrl }}
              style={styles.horizontalPhoto}
              resizeMode="cover"
            />
            {showDates && (
              <Text style={styles.photoDate}>{formatDate(photo.date)}</Text>
            )}
          </TouchableOpacity>
        ))}

        {onAddPress && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddPress}
            accessibilityLabel="Add progress photo"
          >
            <View style={styles.addButtonInner}>
              <Ionicons name="add" size={28} color="#007AFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  // Grid layout
  return (
    <View style={[styles.gridContainer, style]}>
      {photos.map((photo, index) => (
        <TouchableOpacity
          key={`${photo.metricsId}-${photo.position}-${index}`}
          style={styles.gridItem}
          onPress={() => onPhotoPress?.(photo)}
          activeOpacity={0.8}
          accessibilityLabel={`Progress photo from ${formatDate(photo.date)}, ${photo.position.toLowerCase()} view`}
        >
          <Image
            source={{ uri: photo.imageUrl }}
            style={styles.gridPhoto}
            resizeMode="cover"
          />
          {showDates && (
            <Text style={styles.gridPhotoDate}>{formatDate(photo.date)}</Text>
          )}
        </TouchableOpacity>
      ))}

      {onAddPress && (
        <TouchableOpacity
          style={styles.gridAddButton}
          onPress={onAddPress}
          accessibilityLabel="Add progress photo"
        >
          <View style={styles.gridAddButtonInner}>
            <Ionicons name="camera" size={24} color="#007AFF" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Empty state component
interface PhotoEmptyStateProps {
  onAddPress?: () => void;
}

export function PhotoEmptyState({ onAddPress }: PhotoEmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="camera-outline" size={48} color="#8E8E93" />
      <Text style={styles.emptyTitle}>Capture your transformation</Text>
      <Text style={styles.emptySubtitle}>
        Take progress photos to see your visual changes over time
      </Text>
      {onAddPress && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={onAddPress}
          accessibilityLabel="Take first photo"
        >
          <Text style={styles.emptyButtonText}>Take First Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Horizontal scroll
  horizontalContainer: {
    marginHorizontal: -16,
  },
  horizontalContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  photoItem: {
    alignItems: 'center',
  },
  horizontalPhoto: {
    width: 80,
    height: 107,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  photoDate: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  addButton: {
    alignItems: 'center',
  },
  addButtonInner: {
    width: 80,
    height: 107,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },

  // Grid layout
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    alignItems: 'center',
  },
  gridPhoto: {
    width: 100,
    height: 133,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  gridPhotoDate: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  gridAddButton: {
    alignItems: 'center',
  },
  gridAddButtonInner: {
    width: 100,
    height: 133,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PhotoGrid;

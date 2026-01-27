import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePhotoTimeline } from '../../../src/hooks/useBodyMetrics';
import type { ProgressPhotoTimeline } from '../../../src/types/analytics';
import { Button } from '../../../src/components/ui';

const screenWidth = Dimensions.get('window').width;
const photoWidth = (screenWidth - 48 - 24) / 3; // 3 columns with padding and gaps

type PhotoPosition = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';

export default function PhotosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ highlight?: string }>();
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhotoTimeline | null>(null);
  const [positionFilter, setPositionFilter] = useState<PhotoPosition | null>(null);

  const { data, isLoading, isRefetching, refetch } = usePhotoTimeline({
    position: positionFilter ?? undefined,
  });

  const photos = data?.photos ?? [];

  // Group photos by month
  const groupedPhotos = useMemo(() => {
    const groups: Record<string, { photos: ProgressPhotoTimeline[]; sortKey: string }> = {};

    photos.forEach((photo) => {
      const date = new Date(photo.date);
      const displayKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
      // Use YYYY-MM format for proper sorting
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[displayKey]) {
        groups[displayKey] = { photos: [], sortKey };
      }
      groups[displayKey].photos.push(photo);
    });

    // Sort by the sortKey (YYYY-MM format) in descending order (newest first)
    return Object.entries(groups)
      .map(([month, data]) => [month, data.photos, data.sortKey] as const)
      .sort((a, b) => b[2].localeCompare(a[2]))
      .map(([month, monthPhotos]) => [month, monthPhotos] as [string, ProgressPhotoTimeline[]]);
  }, [photos]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleAddPhoto = useCallback(() => {
    router.push('/progress/log');
  }, [router]);

  const formatPhotoDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterPill, !positionFilter && styles.filterPillActive]}
            onPress={() => setPositionFilter(null)}
          >
            <Text
              style={[
                styles.filterText,
                !positionFilter && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {(['FRONT', 'BACK', 'LEFT', 'RIGHT'] as PhotoPosition[]).map((pos) => (
            <TouchableOpacity
              key={pos}
              style={[
                styles.filterPill,
                positionFilter === pos && styles.filterPillActive,
              ]}
              onPress={() => setPositionFilter(pos)}
            >
              <Text
                style={[
                  styles.filterText,
                  positionFilter === pos && styles.filterTextActive,
                ]}
              >
                {pos.charAt(0) + pos.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
      >
        {groupedPhotos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No progress photos yet</Text>
            <Text style={styles.emptySubtitle}>
              Take photos to track your visual transformation over time
            </Text>
            <Button
              title="Add First Photo"
              onPress={handleAddPhoto}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          groupedPhotos.map(([month, monthPhotos]) => (
            <View key={month} style={styles.monthSection}>
              <Text style={styles.monthTitle}>{month}</Text>
              <View style={styles.photoGrid}>
                {monthPhotos.map((photo, index) => (
                  <TouchableOpacity
                    key={`${photo.metricsId}-${photo.position}-${index}`}
                    style={styles.photoItem}
                    onPress={() => setSelectedPhoto(photo)}
                    accessibilityLabel={`Progress photo from ${formatPhotoDate(
                      photo.date
                    )}, ${photo.position.toLowerCase()} view`}
                  >
                    <Image
                      source={{ uri: photo.imageUrl }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                    <View style={styles.photoOverlay}>
                      <Text style={styles.photoDate}>
                        {formatPhotoDate(photo.date)}
                      </Text>
                      {photo.weightKg && (
                        <Text style={styles.photoWeight}>
                          {photo.weightKg.toFixed(1)} kg
                        </Text>
                      )}
                    </View>
                    <View style={styles.positionBadge}>
                      <Text style={styles.positionText}>
                        {photo.position.charAt(0)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Photo FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddPhoto}
        accessibilityLabel="Add photo"
      >
        <Ionicons name="camera" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Photo Detail Modal */}
      <Modal
        visible={selectedPhoto !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedPhoto(null)}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.imageUrl }}
                style={styles.modalImage}
                resizeMode="contain"
              />

              <View style={styles.modalInfo}>
                <Text style={styles.modalDate}>
                  {new Date(selectedPhoto.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.modalPosition}>
                  {selectedPhoto.position.charAt(0) +
                    selectedPhoto.position.slice(1).toLowerCase()}{' '}
                  View
                </Text>
                {selectedPhoto.weightKg && (
                  <Text style={styles.modalWeight}>
                    Weight: {selectedPhoto.weightKg.toFixed(1)} kg
                  </Text>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterContent: {
    padding: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterPillActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 24,
    width: 200,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: photoWidth,
    height: photoWidth * 1.33,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  photoDate: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  photoWeight: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  positionBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalImage: {
    width: screenWidth,
    height: screenWidth * 1.33,
  },
  modalInfo: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    padding: 16,
    alignItems: 'center',
  },
  modalDate: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalPosition: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  modalWeight: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});

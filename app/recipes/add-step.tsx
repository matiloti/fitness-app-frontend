import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAddStep } from '../../src/hooks/useRecipes';
import { useRecipeFormStore } from '../../src/stores/recipeFormStore';

export default function AddStepScreen() {
  const router = useRouter();
  const { mode, recipeId } = useLocalSearchParams<{
    mode: 'create' | 'edit';
    recipeId?: string;
  }>();

  // Use shared store for create mode
  const addStepToStore = useRecipeFormStore((state) => state.addStep);

  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);

  const addStep = useAddStep();

  const handleClose = useCallback(() => {
    if (description.trim()) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard this step?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [description, router]);

  const handleAddStep = useCallback(async () => {
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please enter a step description.');
      return;
    }

    if (description.trim().length < 5) {
      Alert.alert('Invalid Description', 'Step description must be at least 5 characters.');
      return;
    }

    if (mode === 'edit' && recipeId) {
      // Edit mode: call API directly
      try {
        await addStep.mutateAsync({
          recipeId,
          data: {
            description: description.trim(),
            durationMinutes: durationMinutes ?? undefined,
          },
        });
        router.back();
      } catch (err) {
        Alert.alert('Error', 'Failed to add step. Please try again.');
      }
    } else {
      // Create mode: add to store
      addStepToStore({
        description: description.trim(),
        durationMinutes: durationMinutes ?? undefined,
      });
      router.back();
    }
  }, [description, durationMinutes, mode, recipeId, addStep, addStepToStore, router]);

  const handleDurationChange = useCallback((delta: number) => {
    setDurationMinutes((prev) => {
      const newValue = (prev ?? 0) + delta;
      if (newValue < 0) return null;
      if (newValue > 180) return 180;
      return newValue === 0 ? null : newValue;
    });
  }, []);

  const canAdd = description.trim().length >= 5;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Step</Text>
          <TouchableOpacity
            style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
            onPress={handleAddStep}
            disabled={!canAdd || addStep.isPending}
          >
            <Text style={[styles.addText, !canAdd && styles.addTextDisabled]}>
              {addStep.isPending ? 'Adding...' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Drag Indicator (modal style) */}
        <View style={styles.dragIndicator}>
          <View style={styles.dragBar} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step Description *</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe this cooking step..."
                placeholderTextColor="#C7C7CC"
                multiline
                numberOfLines={5}
                maxLength={500}
                autoFocus
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration (optional)</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity
                style={[styles.durationButton, durationMinutes === null && styles.durationButtonDisabled]}
                onPress={() => handleDurationChange(-1)}
                disabled={durationMinutes === null || durationMinutes <= 0}
              >
                <Ionicons
                  name="remove"
                  size={24}
                  color={durationMinutes === null ? '#C7C7CC' : '#007AFF'}
                />
              </TouchableOpacity>

              <View style={styles.durationValue}>
                <Text style={styles.durationText}>
                  {durationMinutes === null ? '--' : durationMinutes}
                </Text>
                <Text style={styles.durationUnit}>min</Text>
              </View>

              <TouchableOpacity
                style={[styles.durationButton, durationMinutes === 180 && styles.durationButtonDisabled]}
                onPress={() => handleDurationChange(1)}
                disabled={durationMinutes === 180}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={durationMinutes === 180 ? '#C7C7CC' : '#007AFF'}
                />
              </TouchableOpacity>
            </View>

            {/* Quick duration buttons */}
            <View style={styles.quickDurations}>
              {[5, 10, 15, 30, 60].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.quickDurationButton,
                    durationMinutes === mins && styles.quickDurationButtonActive,
                  ]}
                  onPress={() => setDurationMinutes(mins)}
                >
                  <Text
                    style={[
                      styles.quickDurationText,
                      durationMinutes === mins && styles.quickDurationTextActive,
                    ]}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
            <Text style={styles.tipsText}>
              Be specific and clear. Good steps help others follow your recipe!
            </Text>
          </View>
        </View>

        {/* Bottom Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !canAdd && styles.submitButtonDisabled]}
            onPress={handleAddStep}
            disabled={!canAdd || addStep.isPending}
          >
            <Text style={styles.submitButtonText}>
              {addStep.isPending ? 'Adding Step...' : 'Add Step'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  cancelButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  addTextDisabled: {
    color: '#C7C7CC',
  },
  dragIndicator: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  dragBar: {
    width: 36,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 2.5,
  },
  content: {
    flex: 1,
    padding: 16,
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
  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  textArea: {
    fontSize: 17,
    color: '#000',
    padding: 16,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  durationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonDisabled: {
    opacity: 0.5,
  },
  durationValue: {
    alignItems: 'center',
    marginHorizontal: 32,
  },
  durationText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#000',
  },
  durationUnit: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  quickDurations: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickDurationButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickDurationButtonActive: {
    backgroundColor: '#007AFF',
  },
  quickDurationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  quickDurationTextActive: {
    color: '#FFFFFF',
  },
  tipsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

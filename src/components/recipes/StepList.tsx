import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RecipeStep } from '../../services/recipeService';

interface StepListProps {
  steps: RecipeStep[];
  editable?: boolean;
  onStepPress?: (step: RecipeStep) => void;
  onDeleteStep?: (stepId: number) => void;
}

export function StepList({
  steps,
  editable = false,
  onStepPress,
  onDeleteStep,
}: StepListProps) {
  if (steps.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="list-outline" size={32} color="#C7C7CC" />
        <Text style={styles.emptyText}>No cooking steps added</Text>
        <Text style={styles.emptySubtext}>Steps are optional</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <StepRow
          key={step.id}
          step={step}
          editable={editable}
          onPress={onStepPress}
          onDelete={onDeleteStep}
          isLast={index === steps.length - 1}
        />
      ))}
    </View>
  );
}

interface StepRowProps {
  step: RecipeStep;
  editable: boolean;
  onPress?: (step: RecipeStep) => void;
  onDelete?: (stepId: number) => void;
  isLast: boolean;
}

function StepRow({ step, editable, onPress, onDelete, isLast }: StepRowProps) {
  const content = (
    <View style={[styles.row, !isLast && styles.rowWithLine]}>
      {editable && (
        <View style={styles.dragHandle}>
          <Ionicons name="reorder-three" size={20} color="#C7C7CC" />
        </View>
      )}

      <View style={styles.stepNumberContainer}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
        </View>
        {!isLast && <View style={styles.verticalLine} />}
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>{step.description}</Text>
        {step.durationMinutes && step.durationMinutes > 0 && (
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={14} color="#8E8E93" />
            <Text style={styles.duration}>
              {formatDuration(step.durationMinutes)}
            </Text>
          </View>
        )}
      </View>

      {editable && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(step.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={`Delete step ${step.stepNumber}`}
        >
          <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress && !editable) {
    return (
      <TouchableOpacity
        onPress={() => onPress(step)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Step ${step.stepNumber}, ${step.description}${step.durationMinutes ? `, ${step.durationMinutes} minutes` : ''}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

interface EditableStepItemProps {
  step: RecipeStep;
  onEdit: () => void;
  onDelete: () => void;
}

export function EditableStepItem({ step, onEdit, onDelete }: EditableStepItemProps) {
  return (
    <View style={styles.editableRow}>
      <View style={styles.dragHandle}>
        <Ionicons name="reorder-three" size={20} color="#C7C7CC" />
      </View>

      <TouchableOpacity style={styles.editableContent} onPress={onEdit} activeOpacity={0.7}>
        <View style={styles.editableHeader}>
          <View style={styles.stepNumberSmall}>
            <Text style={styles.stepNumberSmallText}>{step.stepNumber}</Text>
          </View>
          {step.durationMinutes && step.durationMinutes > 0 && (
            <View style={styles.editableDuration}>
              <Ionicons name="time-outline" size={12} color="#8E8E93" />
              <Text style={styles.editableDurationText}>
                {formatDuration(step.durationMinutes)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.editableDescription} numberOfLines={2}>
          {step.description}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={`Remove step ${step.stepNumber}`}
      >
        <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
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
  return `${hours} hr ${remainingMinutes} min`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#C7C7CC',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    minHeight: 56,
  },
  rowWithLine: {
    // The vertical line is handled by stepNumberContainer
  },
  dragHandle: {
    marginRight: 8,
    alignSelf: 'flex-start',
    paddingTop: 4,
  },
  stepNumberContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 28,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5EA',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingTop: 4,
  },
  description: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  duration: {
    fontSize: 13,
    color: '#8E8E93',
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
    alignSelf: 'flex-start',
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
  editableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepNumberSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editableDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editableDurationText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  editableDescription: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
});

export default StepList;

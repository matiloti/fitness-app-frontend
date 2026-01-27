import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, getDateString, useFormattedDate } from '../../hooks/useDays';

/**
 * Parse a YYYY-MM-DD date string to a Date object at midnight local time
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface DateNavigationProps {
  date: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function DateNavigation({
  date,
  onDateChange,
  minDate,
  maxDate,
}: DateNavigationProps) {
  const [showPicker, setShowPicker] = useState(false);
  const formatted = useFormattedDate(date);
  const today = getDateString();

  const canGoBack = !minDate || date > minDate;
  const canGoForward = !maxDate || date < maxDate;

  const handlePrevious = useCallback(() => {
    // Check bounds directly to avoid stale closure issues
    const canNavigateBack = !minDate || date > minDate;
    if (canNavigateBack) {
      onDateChange(addDays(date, -1));
    }
  }, [date, minDate, onDateChange]);

  const handleNext = useCallback(() => {
    // Check bounds directly to avoid stale closure issues
    const canNavigateForward = !maxDate || date < maxDate;
    if (canNavigateForward) {
      onDateChange(addDays(date, 1));
    }
  }, [date, maxDate, onDateChange]);

  const handleToday = useCallback(() => {
    onDateChange(today);
  }, [today, onDateChange]);

  const handleDateSelect = useCallback(
    (_: unknown, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }
      if (selectedDate) {
        onDateChange(getDateString(selectedDate));
      }
    },
    [onDateChange]
  );

  return (
    <View style={styles.container}>
      {/* Previous day button */}
      <TouchableOpacity
        style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
        onPress={handlePrevious}
        disabled={!canGoBack}
        accessibilityLabel="Previous day"
        accessibilityRole="button"
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={canGoBack ? '#007AFF' : '#C7C7CC'}
        />
      </TouchableOpacity>

      {/* Date display */}
      <TouchableOpacity
        style={styles.dateContainer}
        onPress={() => setShowPicker(true)}
        accessibilityLabel={`${formatted.label}, tap to pick date`}
        accessibilityRole="button"
      >
        <Text style={styles.dateText}>{formatted.label}</Text>
        {formatted.isToday && <View style={styles.todayDot} />}
      </TouchableOpacity>

      {/* Next day button */}
      <TouchableOpacity
        style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
        onPress={handleNext}
        disabled={!canGoForward}
        accessibilityLabel="Next day"
        accessibilityRole="button"
      >
        <Ionicons
          name="chevron-forward"
          size={24}
          color={canGoForward ? '#007AFF' : '#C7C7CC'}
        />
      </TouchableOpacity>

      {/* Calendar button */}
      <TouchableOpacity
        style={styles.calendarButton}
        onPress={() => setShowPicker(true)}
        accessibilityLabel="Open calendar"
        accessibilityRole="button"
      >
        <Ionicons name="calendar-outline" size={22} color="#007AFF" />
      </TouchableOpacity>

      {/* Date picker modal */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          >
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleToday}>
                  <Text style={styles.pickerTodayText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={parseDateString(date)}
                mode="date"
                display="spinner"
                onChange={handleDateSelect}
                minimumDate={minDate ? parseDateString(minDate) : undefined}
                maximumDate={maxDate ? parseDateString(maxDate) : undefined}
                style={styles.datePicker}
                textColor="#000000"
                themeVariant="light"
              />
            </View>
          </TouchableOpacity>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={parseDateString(date)}
            mode="date"
            display="default"
            onChange={handleDateSelect}
            minimumDate={minDate ? parseDateString(minDate) : undefined}
            maximumDate={maxDate ? parseDateString(maxDate) : undefined}
          />
        )
      )}
    </View>
  );
}

interface WeekCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  weekData?: Array<{
    date: string;
    hasData: boolean;
    adherence: 'UNDER' | 'ON_TARGET' | 'OVER';
  }>;
}

export function WeekCalendar({
  selectedDate,
  onDateSelect,
  weekData,
}: WeekCalendarProps) {
  // Generate week days
  const getWeekDays = () => {
    const selected = parseDateString(selectedDate);
    const dayOfWeek = selected.getDay();
    const monday = new Date(selected);
    monday.setDate(selected.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: getDateString(d),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        dayNumber: d.getDate(),
      });
    }
    return days;
  };

  const weekDays = getWeekDays();
  const today = getDateString();

  const getAdherenceColor = (date: string) => {
    const data = weekData?.find((d) => d.date === date);
    if (!data?.hasData) return 'transparent';

    switch (data.adherence) {
      case 'ON_TARGET':
        return '#34C759';
      case 'UNDER':
        return '#FF9500';
      case 'OVER':
        return '#FF3B30';
      default:
        return 'transparent';
    }
  };

  return (
    <View style={styles.weekContainer}>
      {weekDays.map((day) => {
        const isSelected = day.date === selectedDate;
        const isToday = day.date === today;
        const adherenceColor = getAdherenceColor(day.date);

        return (
          <TouchableOpacity
            key={day.date}
            style={styles.dayItem}
            onPress={() => onDateSelect(day.date)}
            accessibilityLabel={`${day.dayName}, ${day.dayNumber}${isSelected ? ', selected' : ''}${isToday ? ', today' : ''}`}
          >
            <Text style={styles.dayName}>{day.dayName}</Text>
            <View
              style={[
                styles.dayCircle,
                isSelected && styles.dayCircleSelected,
                isToday && !isSelected && styles.dayCircleToday,
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  isToday && !isSelected && styles.dayNumberToday,
                ]}
              >
                {day.dayNumber}
              </Text>
            </View>
            {adherenceColor !== 'transparent' && (
              <View
                style={[styles.adherenceDot, { backgroundColor: adherenceColor }]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
  calendarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  pickerCancelText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  pickerTodayText: {
    fontSize: 17,
    color: '#007AFF',
  },
  pickerDoneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  datePicker: {
    height: 200,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  dayItem: {
    alignItems: 'center',
    width: 40,
  },
  dayName: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#007AFF',
  },
  dayCircleToday: {
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dayNumberToday: {
    color: '#007AFF',
  },
  adherenceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});

export default DateNavigation;

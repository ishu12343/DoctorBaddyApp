import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patientApi } from '../../services/patientApi';
import { getErrorMessage } from '../../services/apiClient';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import StarRating from '../../components/StarRating';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface Appointment {
  id: number;
  doctor_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  appointment_datetime?: string;
  status?: string;
  reason?: string;
  has_rating?: number;
  specialty?: string;
  clinic_name?: string;
  doctor_mobile?: string;
  created_at?: string;
  available_days?: string;
  available_from?: string;
  available_to?: string;
}

export default function PatientAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UPCOMING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [rateAppt, setRateAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [webDateError, setWebDateError] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rescheduledAppts, setRescheduledAppts] = useState<Set<number>>(new Set());

  const loadAppointments = useCallback(async () => {
    try {
      const res = await patientApi.getAppointments();
      setAppointments(res.data?.appointments || []);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const handleCancel = (id: number) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await patientApi.cancelAppointment(id);
            loadAppointments();
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const handleReschedule = async () => {
    if (!rescheduleAppt || !newDate || !newTime) return;
    setActionLoading(true);
    try {
      const status = String(rescheduleAppt.status || '').toUpperCase();
      
      if (status === 'PENDING') {
        // Try to update existing booking for PENDING status
        try {
          await patientApi.updateAppointment(rescheduleAppt.id, {
            appointment_date: newDate,
            appointment_time: newTime,
            reason: rescheduleReason,
          });
          Alert.alert('Success', 'Appointment updated');
        } catch (updateErr: any) {
          // Fallback to reschedule API if update endpoint doesn't exist or fails
          console.log('Update endpoint not available, using reschedule instead');
          await patientApi.rescheduleAppointment(rescheduleAppt.id, {
            new_date: newDate,
            new_time: newTime,
            reason: rescheduleReason,
          });
          // Mark this appointment as rescheduled so it won't show reschedule button again
          setRescheduledAppts(prev => new Set(prev).add(rescheduleAppt.id));
          Alert.alert('Success', 'Appointment rescheduled');
        }
      } else {
        // Use reschedule API for other statuses
        await patientApi.rescheduleAppointment(rescheduleAppt.id, {
          new_date: newDate,
          new_time: newTime,
          reason: rescheduleReason,
        });
        // Mark this appointment as rescheduled so it won't show reschedule button again
        setRescheduledAppts(prev => new Set(prev).add(rescheduleAppt.id));
        Alert.alert('Success', 'Appointment rescheduled');
      }
      
      setRescheduleAppt(null);
      setNewDate('');
      setNewTime('');
      setRescheduleReason('');
      loadAppointments();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const normalizeAvailableDays = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map(String).map((t) => t.trim()).filter(Boolean).map((t) => {
        const v = t.toLowerCase();
        if (v.startsWith('sun')) return 'Sunday';
        if (v.startsWith('mon')) return 'Monday';
        if (v.startsWith('tue')) return 'Tuesday';
        if (v.startsWith('wed')) return 'Wednesday';
        if (v.startsWith('thu')) return 'Thursday';
        if (v.startsWith('fri')) return 'Friday';
        if (v.startsWith('sat')) return 'Saturday';
        return t;
      });
    }

    const parts = String(raw).split(/[,\s;|\/\\\-]+/).map((s) => s.trim()).filter(Boolean);
    return parts.map((t) => {
      const v = t.toLowerCase();
      if (v.startsWith('sun')) return 'Sunday';
      if (v.startsWith('mon')) return 'Monday';
      if (v.startsWith('tue')) return 'Tuesday';
      if (v.startsWith('wed')) return 'Wednesday';
      if (v.startsWith('thu')) return 'Thursday';
      if (v.startsWith('fri')) return 'Friday';
      if (v.startsWith('sat')) return 'Saturday';
      return t;
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event?.type === 'dismissed') return;
    let picked = selectedDate;
    if (!picked && event?.nativeEvent?.timestamp) picked = new Date(event.nativeEvent.timestamp);
    if (!picked) return;

    if (isDayAvailable(picked)) {
      const date = picked.toISOString().split('T')[0];
      setNewDate(date);
    } else {
      const avail = normalizeAvailableDays(rescheduleAppt?.available_days).length ? normalizeAvailableDays(rescheduleAppt?.available_days).map(d => d.slice(0,3)).join(', ') : String(rescheduleAppt?.available_days || '');
      Alert.alert('Invalid Date', `Doctor is not available on this day. Available days: ${avail}`);
    }
  };

  const isDayAvailable = (date: Date): boolean => {
    const raw = rescheduleAppt?.available_days;
    if (!raw) return true;
    const allowed = new Set(normalizeAvailableDays(raw));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    return allowed.has(dayName);
  };

  const getAvailableDates = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // Show 3 months ahead

    for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
      if (isDayAvailable(d)) {
        dates.push(new Date(d));
      }
    }
    return dates;
  };

  // Generate time slots between fromTime and toTime (15 minute slots)
  const generateTimeSlots = (fromTime: string, toTime: string): string[] => {
    const slots: string[] = [];
    const [fromHour, fromMin] = fromTime.split(':').map(Number);
    const [toHour, toMin] = toTime.split(':').map(Number);

    let currentHour = fromHour;
    let currentMin = fromMin;
    const toMinutes = toHour * 60 + toMin;

    while (true) {
      const currentMinutes = currentHour * 60 + currentMin;
      if (currentMinutes >= toMinutes) break;

      const nextMinutes = currentMinutes + 15;
      if (nextMinutes > toMinutes) break;

      const nextHour = Math.floor(nextMinutes / 60);
      const nextMin = nextMinutes % 60;

      const formatTime = (h: number, m: number) => {
        const period = h >= 12 ? 'pm' : 'am';
        const hour12 = h % 12 || 12;
        const minStr = m.toString().padStart(2, '0');
        return `${hour12}:${minStr}${period}`;
      };

      const startTime = formatTime(currentHour, currentMin);
      const endTime = formatTime(nextHour, nextMin);
      slots.push(`${startTime}-${endTime}`);

      currentHour = nextHour;
      currentMin = nextMin;
    }

    return slots;
  };

  const formatDateDisplay = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${d.toLocaleDateString()}`;
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      // Validate against doctor's available hours
      if (rescheduleAppt?.available_from && rescheduleAppt?.available_to) {
        const fromTime = parseInt(rescheduleAppt.available_from.replace(':', ''));
        const toTime = parseInt(rescheduleAppt.available_to.replace(':', ''));
        const selectedTimeNum = parseInt(timeStr.replace(':', ''));
        
        if (selectedTimeNum < fromTime || selectedTimeNum > toTime) {
          Alert.alert('Invalid Time', `Please select a time between ${rescheduleAppt.available_from} and ${rescheduleAppt.available_to}`);
          return;
        }
      }
      
      setNewTime(timeStr);
    }
  };

  const handleRate = async () => {
    if (!rateAppt || rating === 0) return;
    setActionLoading(true);
    try {
      await patientApi.rateAppointment(rateAppt.id, { rating, review });
      setRateAppt(null);
      setRating(0);
      setReview('');
      Alert.alert('Success', 'Thank you for your feedback!');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const filteredAppointments = appointments
    .filter((appt) => {
      const status = String(appt.status || '').toUpperCase();
      const apptDate = String(appt.appointment_date || '');
      const apptTime = String(appt.appointment_time || '');
      const apptDateTime = new Date(`${apptDate}T${apptTime}`);
      const now = new Date();

      switch (selectedFilter) {
        case 'ALL':
          return true;
        case 'UPCOMING':
          return status !== 'CANCELLED' && apptDateTime >= now;
        case 'CONFIRMED':
          return status === 'APPROVED' || status === 'CONFIRMED';
        case 'CANCELLED':
          return status === 'CANCELLED';
        default:
          return true;
      }
    })
    .sort((a, b) => {
      const dateA = new Date(`${String(a.appointment_date)}T${String(a.appointment_time)}`);
      const dateB = new Date(`${String(b.appointment_date)}T${String(b.appointment_time)}`);
      // For UPCOMING, sort ascending (nearest date first)
      // For other filters, sort descending (most recent first)
      // if (selectedFilter === 'UPCOMING') {
      //   return dateA.getTime() - dateB.getTime();
      // }
        if (
            ['ALL', 'UPCOMING', 'CONFIRMED', 'CANCELLED'].includes(selectedFilter)
        ) {
            return dateA.getTime() - dateB.getTime();
        }
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.filterContainer}>
        {(['ALL', 'UPCOMING', 'CONFIRMED', 'CANCELLED'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter.charAt(0) + filter.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAppointments(); }} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="No appointments" message="Book an appointment with a doctor" />}
        renderItem={({ item }) => {
          const status = String(item.status || '').toUpperCase();
          const canCancel = ['PENDING', 'APPROVED'].includes(status);
          const canReschedule = !rescheduledAppts.has(item.id);
          const canRate = status === 'COMPLETED' && !item.has_rating;

          return (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => setSelectedAppt(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.doctorName}>{item.doctor_name || 'Doctor'}</Text>
                <StatusBadge status={status} />
              </View>
              <Text style={styles.dateTime}>
                {item.appointment_date} at {item.appointment_time}
              </Text>
              {item.reason ? <Text style={styles.reason}>Reason: {item.reason}</Text> : null}
              <View style={styles.actions}>
                {canCancel ? (
                  <AppButton title="Cancel" variant="danger" onPress={() => handleCancel(item.id)} style={styles.actionBtn} />
                ) : null}
                {canReschedule ? (
                  <AppButton title="Reschedule" variant="outline" onPress={() => setRescheduleAppt(item)} style={styles.actionBtn} />
                ) : null}
                {canRate ? (
                  <AppButton title="Rate" variant="secondary" onPress={() => setRateAppt(item)} style={styles.actionBtn} />
                ) : null}
                {status === 'COMPLETED' && item.has_rating ? (
                  <View style={styles.ratedBadge}>
                    <Text style={styles.ratedText}>Rated</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={!!rescheduleAppt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <Text style={styles.availabilityText}>Available: {normalizeAvailableDays(rescheduleAppt?.available_days).length ? normalizeAvailableDays(rescheduleAppt?.available_days).map(d => d.slice(0,3)).join(', ') : 'Any day'}</Text>
            {Platform.OS === 'web' ? (
              <>
                <View style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>New Date:</Text>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e: any) => {
                      const val = e.target.value;
                      const parts = val ? val.split('-').map(Number) : [];
                      const selectedDate = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(val);
                      if (isDayAvailable(selectedDate)) {
                        setNewDate(val);
                        setWebDateError('');
                      } else {
                        const avail = normalizeAvailableDays(rescheduleAppt?.available_days).length ? normalizeAvailableDays(rescheduleAppt?.available_days).map(d => d.slice(0,3)).join(', ') : String(rescheduleAppt?.available_days || '');
                        setWebDateError(`Doctor is not available on this day. Available: ${avail}`);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    style={styles.webInput}
                  />
                  {webDateError ? <Text style={styles.errorText}>{webDateError}</Text> : null}
                </View>

                {rescheduleAppt?.available_from && rescheduleAppt?.available_to && (
                  <View style={styles.timeSlotContainer}>
                    <Text style={styles.timeSlotLabel}>Available Time Slots:</Text>
                    <View style={styles.timeSlotGrid}>
                      {generateTimeSlots(String(rescheduleAppt.available_from), String(rescheduleAppt.available_to)).map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.timeSlot, selectedTimeSlot === slot && styles.timeSlotSelected]}
                          onPress={() => {
                            setSelectedTimeSlot(slot);
                            setNewTime(formatTimeSlotTo24Hour(slot));
                          }}
                        >
                          <Text style={[styles.timeSlotText, selectedTimeSlot === slot && styles.timeSlotTextSelected]}>{slot}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>New Date:</Text>
                  <Text style={styles.pickerValue}>{newDate || 'Select Date'}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={newDate ? new Date(newDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    style={{ width: '100%' }}
                  />
                )}

                {rescheduleAppt?.available_from && rescheduleAppt?.available_to && (
                  <View style={styles.timeSlotContainer}>
                    <Text style={styles.timeSlotLabel}>Available Time Slots:</Text>
                    <View style={styles.timeSlotGrid}>
                      {generateTimeSlots(String(rescheduleAppt.available_from), String(rescheduleAppt.available_to)).map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.timeSlot, selectedTimeSlot === slot && styles.timeSlotSelected]}
                          onPress={() => {
                            setSelectedTimeSlot(slot);
                            setNewTime(formatTimeSlotTo24Hour(slot));
                          }}
                        >
                          <Text style={[styles.timeSlotText, selectedTimeSlot === slot && styles.timeSlotTextSelected]}>{slot}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
            <AppInput label="Reason" value={rescheduleReason} onChangeText={setRescheduleReason} />
            <View style={styles.modalButtons}>
              <AppButton title="Cancel" variant="outline" onPress={() => {
                setRescheduleAppt(null);
                setNewDate('');
                setNewTime('');
                setRescheduleReason('');
              }} style={styles.modalBtn} />
              <AppButton title="Confirm" onPress={handleReschedule} loading={actionLoading} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!rateAppt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Your Visit</Text>
            <Text style={styles.modalDoctor}>Dr. {rateAppt?.doctor_name}</Text>
            <StarRating rating={rating} onRate={setRating} />
            <AppInput label="Review (optional)" value={review} onChangeText={setReview} multiline containerStyle={{ marginTop: spacing.md }} />
            <View style={styles.modalButtons}>
              <AppButton title="Cancel" variant="outline" onPress={() => setRateAppt(null)} style={styles.modalBtn} />
              <AppButton title="Submit" onPress={handleRate} loading={actionLoading} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedAppt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Appointment Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Doctor:</Text>
                <Text style={styles.detailValue}>Dr. {selectedAppt?.doctor_name}</Text>
              </View>
              {selectedAppt?.specialty && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Specialty:</Text>
                  <Text style={styles.detailValue}>{selectedAppt.specialty}</Text>
                </View>
              )}
              {selectedAppt?.clinic_name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Clinic:</Text>
                  <Text style={styles.detailValue}>{selectedAppt.clinic_name}</Text>
                </View>
              )}
              {selectedAppt?.doctor_mobile && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedAppt.doctor_mobile}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date & Time:</Text>
                <Text style={styles.detailValue}>{selectedAppt?.appointment_datetime}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <StatusBadge status={String(selectedAppt?.status || '').toUpperCase()} />
              </View>
              {selectedAppt?.reason && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailValue}>{selectedAppt.reason}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booked On:</Text>
                <Text style={styles.detailValue}>{selectedAppt?.created_at}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rating Status:</Text>
                <Text style={styles.detailValue}>
                  {selectedAppt?.has_rating ? 'Rated' : 'Not Rated'}
                </Text>
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              {selectedAppt && !rescheduledAppts.has(selectedAppt.id) && (
                <AppButton 
                  title="Reschedule" 
                  variant="secondary" 
                  onPress={() => {
                    setSelectedAppt(null);
                    setRescheduleAppt(selectedAppt);
                  }} 
                  style={styles.modalBtn} 
                />
              )}
              <AppButton title="Close" variant="outline" onPress={() => setSelectedAppt(null)} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterContainer: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterTab: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center', borderRadius: borderRadius.sm, marginHorizontal: 2 },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTabTextActive: { color: colors.white },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  dateTime: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm },
  reason: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 100, minHeight: 36 },
  ratedBadge: { backgroundColor: colors.success, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  ratedText: { fontSize: 12, fontWeight: '600', color: colors.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  modalDoctor: { fontSize: 15, color: colors.primary, marginBottom: spacing.md, marginTop: spacing.xs },
  availabilityText: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  errorText: { color: '#FF3B30', marginTop: 6 },
  modalButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  detailLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, width: 100 },
  detailValue: { fontSize: 14, color: colors.text, flex: 1, textAlign: 'right' },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  pickerLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  pickerValue: { fontSize: 14, color: colors.primary },
  webInput: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 14, minWidth: 150 },
  timeSlotContainer: { marginTop: spacing.md },
  timeSlotLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  timeSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateSlot: { backgroundColor: colors.background, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: '#ddd', marginRight: spacing.sm },
  dateSlotSelected: { backgroundColor: colors.primary },
  dateSlotText: { color: colors.text },
  dateSlotTextSelected: { color: colors.white },
});

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
import { TextInput } from 'react-native-web';
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
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [rateAppt, setRateAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
      await patientApi.rescheduleAppointment(rescheduleAppt.id, {
        new_date: newDate,
        new_time: newTime,
        reason: rescheduleReason,
      });
      setRescheduleAppt(null);
      setNewDate('');
      setNewTime('');
      setRescheduleReason('');
      loadAppointments();
      Alert.alert('Success', 'Appointment rescheduled');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const date = selectedDate.toISOString().split('T')[0];
      setNewDate(date);
    }
  };

  const isDayAvailable = (date: Date): boolean => {
    if (!rescheduleAppt?.available_days) return true;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    return rescheduleAppt.available_days.includes(dayName);
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

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAppointments(); }} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="No appointments" message="Book an appointment with a doctor" />}
        renderItem={({ item }) => {
          const status = String(item.status || '').toUpperCase();
          const canCancel = ['PENDING', 'APPROVED'].includes(status);
          const canReschedule = ['PENDING', 'APPROVED'].includes(status);
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
              {item.reason && <Text style={styles.reason}>Reason: {item.reason}</Text>}
              <View style={styles.actions}>
                {canCancel && (
                  <AppButton title="Cancel" variant="danger" onPress={() => handleCancel(item.id)} style={styles.actionBtn} />
                )}
                {canReschedule && (
                  <AppButton title="Reschedule" variant="outline" onPress={() => setRescheduleAppt(item)} style={styles.actionBtn} />
                )}
                {canRate && (
                  <AppButton title="Rate" variant="secondary" onPress={() => setRateAppt(item)} style={styles.actionBtn} />
                )}
                {status === 'COMPLETED' && item.has_rating && (
                  <View style={styles.ratedBadge}>
                    <Text style={styles.ratedText}>Rated</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={!!rescheduleAppt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            {Platform.OS === 'web' ? (
              <>
                <View style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>New Date:</Text>
                  <input 
                    type="date" 
                    value={newDate} 
                    onChange={(e: any) => {
                      const selectedDate = new Date(e.target.value);
                      if (isDayAvailable(selectedDate)) {
                        setNewDate(e.target.value);
                      } else {
                        Alert.alert('Invalid Date', `Doctor is not available on this day. Available days: ${rescheduleAppt?.available_days}`);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    style={styles.webInput}
                  />
                </View>
                <View style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>New Time:</Text>
                  <input 
                    type="time" 
                    value={newTime} 
                    onChange={(e: any) => {
                      const timeStr = e.target.value;
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
                    }}
                    style={styles.webInput}
                  />
                </View>
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
                    onChange={(event: any, date?: Date) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (event.type === 'set' && date) {
                        if (isDayAvailable(date)) {
                          const dateStr = date.toISOString().split('T')[0];
                          setNewDate(dateStr);
                        } else {
                          Alert.alert('Invalid Date', `Doctor is not available on this day. Available days: ${rescheduleAppt?.available_days}`);
                        }
                      }
                    }}
                    minimumDate={new Date()}
                    style={{ width: '100%' }}
                  />
                )}
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>New Time:</Text>
                  <Text style={styles.pickerValue}>{newTime || 'Select Time'}</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={newTime ? new Date(`2000-01-01T${newTime}`) : new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    style={{ width: '100%' }}
                  />
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
              {selectedAppt && ['PENDING', 'APPROVED', 'COMPLETED'].includes(String(selectedAppt.status || '').toUpperCase()) && (
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
  modalButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  detailLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, width: 100 },
  detailValue: { fontSize: 14, color: colors.text, flex: 1, textAlign: 'right' },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  pickerLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  pickerValue: { fontSize: 14, color: colors.primary },
  webInput: { padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14, minWidth: 150 },
});

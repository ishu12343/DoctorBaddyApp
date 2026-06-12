import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
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
  status?: string;
  reason?: string;
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
      loadAppointments();
      Alert.alert('Success', 'Appointment rescheduled');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
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
          const canRate = status === 'COMPLETED';

          return (
            <View style={styles.card}>
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
              </View>
            </View>
          );
        }}
      />

      <Modal visible={!!rescheduleAppt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <AppInput label="New Date (YYYY-MM-DD)" value={newDate} onChangeText={setNewDate} />
            <AppInput label="New Time (HH:MM)" value={newTime} onChangeText={setNewTime} />
            <AppInput label="Reason" value={rescheduleReason} onChangeText={setRescheduleReason} />
            <View style={styles.modalButtons}>
              <AppButton title="Cancel" variant="outline" onPress={() => setRescheduleAppt(null)} style={styles.modalBtn} />
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  modalDoctor: { fontSize: 15, color: colors.primary, marginBottom: spacing.md, marginTop: spacing.xs },
  modalButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1 },
});

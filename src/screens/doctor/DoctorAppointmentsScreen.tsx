import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doctorApi } from '../../services/doctorApi';
import { getErrorMessage } from '../../services/apiClient';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface Appointment {
  id: number;
  patient_name?: string;
  patient_mobile?: string;
  appointment_date?: string;
  appointment_time?: string;
  status?: string;
  reason?: string;
}

export default function DoctorAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      const res = await doctorApi.getAppointments();
      setAppointments(res.data?.appointments || []);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const handleAction = async (id: number, action: 'approve' | 'reject' | 'complete') => {
    try {
      if (action === 'approve') await doctorApi.approveAppointment(id);
      else if (action === 'reject') await doctorApi.rejectAppointment(id);
      else await doctorApi.completeAppointment(id);
      loadAppointments();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleAppt || !newDate || !newTime) return;
    setActionLoading(true);
    try {
      await doctorApi.rescheduleAppointment(rescheduleAppt.id, {
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

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAppointments(); }} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="No appointments" />}
        renderItem={({ item }) => {
          const status = String(item.status || '').toUpperCase();
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>{item.patient_name || 'Patient'}</Text>
                <StatusBadge status={status} />
              </View>
              <Text style={styles.dateTime}>{item.appointment_date} at {item.appointment_time}</Text>
              {item.reason && <Text style={styles.reason}>Reason: {item.reason}</Text>}
              {item.patient_mobile && (
                <AppButton
                  title={`Call ${item.patient_mobile}`}
                  variant="outline"
                  onPress={() => Linking.openURL(`tel:${item.patient_mobile}`)}
                  style={styles.callBtn}
                />
              )}
              <View style={styles.actions}>
                {status === 'PENDING' && (
                  <>
                    <AppButton title="Approve" onPress={() => handleAction(item.id, 'approve')} style={styles.actionBtn} />
                    <AppButton title="Reject" variant="danger" onPress={() => handleAction(item.id, 'reject')} style={styles.actionBtn} />
                  </>
                )}
                {status === 'APPROVED' && (
                  <>
                    <AppButton title="Complete" variant="secondary" onPress={() => handleAction(item.id, 'complete')} style={styles.actionBtn} />
                    <AppButton title="Reschedule" variant="outline" onPress={() => setRescheduleAppt(item)} style={styles.actionBtn} />
                  </>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  dateTime: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm },
  reason: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  callBtn: { marginTop: spacing.sm, minHeight: 36 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 100, minHeight: 36 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  modalButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1 },
});

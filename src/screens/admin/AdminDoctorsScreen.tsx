import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../services/adminApi';
import { getErrorMessage } from '../../services/apiClient';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface Doctor {
  id: number;
  full_name?: string;
  email?: string;
  specialty?: string;
  mobile?: string;
  approved?: boolean;
  suspended?: boolean;
  rejected?: boolean;
}

export default function AdminDoctorsScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadDoctors = useCallback(async () => {
    try {
      const res = await adminApi.getDoctors();
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);

  const getDoctorStatus = (doc: Doctor) => {
    if (doc.suspended) return 'SUSPENDED';
    if (doc.rejected) return 'REJECTED';
    if (doc.approved) return 'APPROVED';
    return 'PENDING';
  };

  const handleAction = async (id: number, action: string) => {
    try {
      switch (action) {
        case 'approve': await adminApi.approveDoctor(id); break;
        case 'reject': await adminApi.rejectDoctor(id); break;
        case 'suspend': await adminApi.suspendDoctor(id); break;
        case 'unsuspend': await adminApi.unsuspendDoctor(id); break;
      }
      setSelectedDoctor(null);
      loadDoctors();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const viewDoctor = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await adminApi.viewDoctor(id);
      setSelectedDoctor(res.data?.data || res.data);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={doctors}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDoctors(); }} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="medkit-outline" title="No doctors" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => viewDoctor(item.id)}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.full_name || 'Doctor'}</Text>
              <StatusBadge status={getDoctorStatus(item)} />
            </View>
            <Text style={styles.detail}>{item.specialty || 'General'}</Text>
            <Text style={styles.detail}>{item.email}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selectedDoctor} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {detailLoading ? (
              <LoadingSpinner />
            ) : selectedDoctor ? (
              <ScrollView>
                <Text style={styles.modalTitle}>{String(selectedDoctor.full_name || 'Doctor Details')}</Text>
                {Object.entries(selectedDoctor).map(([key, value]) =>
                  value != null && typeof value !== 'object' ? (
                    <View key={key} style={styles.detailRow}>
                      <Text style={styles.detailKey}>{key.replace(/_/g, ' ')}</Text>
                      <Text style={styles.detailVal}>{String(value)}</Text>
                    </View>
                  ) : null
                )}
                <View style={styles.modalActions}>
                  {!Boolean(selectedDoctor.approved) && !Boolean(selectedDoctor.rejected) && (
                    <>
                      <AppButton title="Approve" onPress={() => handleAction(Number(selectedDoctor.id), 'approve')} style={styles.modalBtn} />
                      <AppButton title="Reject" variant="danger" onPress={() => handleAction(Number(selectedDoctor.id), 'reject')} style={styles.modalBtn} />
                    </>
                  )}
                  {Boolean(selectedDoctor.approved) && !Boolean(selectedDoctor.suspended) && (
                    <AppButton title="Suspend" variant="danger" onPress={() => handleAction(Number(selectedDoctor.id), 'suspend')} style={styles.modalBtn} />
                  )}
                  {Boolean(selectedDoctor.suspended) && (
                    <AppButton title="Unsuspend" onPress={() => handleAction(Number(selectedDoctor.id), 'unsuspend')} style={styles.modalBtn} />
                  )}
                </View>
                <AppButton title="Close" variant="outline" onPress={() => setSelectedDoctor(null)} />
              </ScrollView>
            ) : null}
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
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  detail: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  detailRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailKey: { fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize' },
  detailVal: { fontSize: 15, color: colors.text, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md, flexWrap: 'wrap' },
  modalBtn: { flex: 1, minWidth: 120 },
});

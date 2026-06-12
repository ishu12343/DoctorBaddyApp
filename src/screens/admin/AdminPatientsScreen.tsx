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

interface Patient {
  id: number;
  full_name?: string;
  email?: string;
  mobile?: string;
  active?: boolean;
  status?: string;
}

export default function AdminPatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Record<string, unknown> | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      const res = await adminApi.getPatients();
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const getPatientStatus = (pat: Patient) => {
    if (pat.active === false || pat.status === 'INACTIVE') return 'INACTIVE';
    return 'ACTIVE';
  };

  const handleAction = async (id: number, action: 'activate' | 'deactivate') => {
    try {
      if (action === 'activate') await adminApi.activatePatient(id);
      else await adminApi.deactivatePatient(id);
      setSelectedPatient(null);
      loadPatients();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const viewPatient = async (id: number) => {
    try {
      const res = await adminApi.viewPatient(id);
      setSelectedPatient(res.data?.data || res.data);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={patients}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPatients(); }} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="people-outline" title="No patients" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => viewPatient(item.id)}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.full_name || 'Patient'}</Text>
              <StatusBadge status={getPatientStatus(item)} />
            </View>
            <Text style={styles.detail}>{item.email}</Text>
            <Text style={styles.detail}>{item.mobile}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selectedPatient} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>{String(selectedPatient?.full_name || 'Patient Details')}</Text>
              {selectedPatient && Object.entries(selectedPatient).map(([key, value]) =>
                value != null && typeof value !== 'object' ? (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{key.replace(/_/g, ' ')}</Text>
                    <Text style={styles.detailVal}>{String(value)}</Text>
                  </View>
                ) : null
              )}
              <View style={styles.modalActions}>
                {selectedPatient?.active !== false ? (
                  <AppButton title="Deactivate" variant="danger" onPress={() => handleAction(Number(selectedPatient?.id), 'deactivate')} style={styles.modalBtn} />
                ) : (
                  <AppButton title="Activate" onPress={() => handleAction(Number(selectedPatient?.id), 'activate')} style={styles.modalBtn} />
                )}
              </View>
              <AppButton title="Close" variant="outline" onPress={() => setSelectedPatient(null)} />
            </ScrollView>
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
  modalActions: { marginVertical: spacing.md },
  modalBtn: { width: '100%' },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/adminApi';
import { getErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function AdminHomeScreen() {
  const { logout } = useAuth();
  const [doctors, setDoctors] = useState<Record<string, unknown>[]>([]);
  const [patients, setPatients] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [docRes, patRes] = await Promise.all([
        adminApi.getDoctors(),
        adminApi.getPatients(),
      ]);
      setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
      setPatients(Array.isArray(patRes.data) ? patRes.data : []);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingSpinner />;

  const pendingDoctors = doctors.filter((d) => !d.approved && !d.rejected).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[colors.primary]} />}
      >
        <Text style={styles.greeting}>Admin Dashboard</Text>
        <Text style={styles.subGreeting}>Control Panel Overview</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="medkit" size={28} color={colors.primary} />
            <Text style={styles.statNumber}>{doctors.length}</Text>
            <Text style={styles.statLabel}>Total Doctors</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={28} color={colors.primary} />
            <Text style={styles.statNumber}>{patients.length}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>
        </View>

        <View style={[styles.statCard, styles.pendingCard]}>
          <Ionicons name="time" size={28} color={colors.warning} />
          <Text style={styles.statNumber}>{pendingDoctors}</Text>
          <Text style={styles.statLabel}>Pending Doctor Approvals</Text>
        </View>

        <AppButton title="Sign Out" variant="danger" onPress={logout} style={styles.logoutBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  greeting: { fontSize: 26, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center' },
  pendingCard: { marginBottom: spacing.lg },
  statNumber: { fontSize: 28, fontWeight: '800', color: colors.primary, marginTop: spacing.sm },
  statLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  logoutBtn: { marginTop: spacing.md },
});

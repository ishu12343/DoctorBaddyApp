import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doctorApi } from '../../services/doctorApi';
import { getErrorMessage } from '../../services/apiClient';
import AppInput from '../../components/AppInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface Patient {
  id: number;
  full_name?: string;
  email?: string;
  mobile?: string;
  gender?: string;
  blood_group?: string;
  status?: string;
}

export default function DoctorPatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filtered, setFiltered] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadPatients = useCallback(async () => {
    try {
      const res = await doctorApi.getPatients();
      const data = res.data?.patients || [];
      setPatients(data);
      setFiltered(data);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  useEffect(() => {
    if (!search) {
      setFiltered(patients);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        patients.filter(
          (p) =>
            (p.full_name || '').toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q) ||
            (p.mobile || '').includes(q)
        )
      );
    }
  }, [search, patients]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchSection}>
        <AppInput placeholder="Search patients..." value={search} onChangeText={setSearch} containerStyle={styles.searchInput} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPatients(); }} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="people-outline" title="No patients found" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.full_name || 'Patient'}</Text>
              <Text style={styles.detail}>{item.email}</Text>
              <Text style={styles.detail}>{item.mobile}</Text>
              <View style={styles.tags}>
                {item.gender && <Text style={styles.tag}>{item.gender}</Text>}
                {item.blood_group && <Text style={styles.tag}>{item.blood_group}</Text>}
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchSection: { padding: spacing.md, backgroundColor: colors.white },
  searchInput: { marginBottom: 0 },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  detail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  tags: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  tag: { fontSize: 11, backgroundColor: '#EBF4FF', color: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontWeight: '600' },
});

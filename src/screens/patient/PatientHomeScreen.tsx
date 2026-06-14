import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { PatientTabParamList } from '../../navigation/types';
import { patientApi } from '../../services/patientApi';
import { getErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function PatientHomeScreen() {
  const navigation = useNavigation<NavigationProp<PatientTabParamList>>();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Record<string, string> | null>(null);
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, apptRes] = await Promise.all([
        patientApi.getProfile(),
        patientApi.getAppointments(),
      ]);
      setProfile(profileRes.data?.patient || null);
      setAppointments(apptRes.data?.appointments || []);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleLogout = async () => {
    console.log('PatientHomeScreen handleLogout called');
    console.log('Calling logout directly');
    await logout();
  };

  const upcoming = appointments.filter(
    (a) => ['PENDING', 'APPROVED'].includes(String(a.status || '').toUpperCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {profile?.full_name || 'Patient'}!
            </Text>
            <Text style={styles.subGreeting}>Welcome to your health dashboard</Text>
          </View>
          <TouchableOpacity style={styles.logoutIconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Total Appointments</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PatientDoctors')}>
            <Ionicons name="search" size={28} color={colors.primary} />
            <Text style={styles.actionText}>Find Doctors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PatientAppointments')}>
            <Ionicons name="calendar-outline" size={28} color={colors.primary} />
            <Text style={styles.actionText}>My Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PatientProfile')}>
            <Ionicons name="person-outline" size={28} color={colors.primary} />
            <Text style={styles.actionText}>My Profile</Text>
          </TouchableOpacity>
        </View>

        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {upcoming.slice(0, 3).map((appt, idx) => (
              <View key={String(appt.id || idx)} style={styles.apptCard}>
                <Text style={styles.apptDoctor}>{String(appt.doctor_name || 'Doctor')}</Text>
                <Text style={styles.apptDate}>
                  {String(appt.appointment_date || '')} at {String(appt.appointment_time || '')}
                </Text>
                <Text style={styles.apptStatus}>{String(appt.status || '')}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { fontSize: 26, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  logoutIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: colors.primary, marginTop: spacing.xs },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  apptCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  apptDoctor: { fontSize: 16, fontWeight: '600', color: colors.text },
  apptDate: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  apptStatus: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 4 },
});

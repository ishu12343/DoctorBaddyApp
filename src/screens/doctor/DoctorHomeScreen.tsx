import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doctorApi } from '../../services/doctorApi';
import { getErrorMessage } from '../../services/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function DoctorHomeScreen() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState({ today_appointments: 0 });
  const [patientCount, setPatientCount] = useState(0);
  const [rating, setRating] = useState({ rating: 0, reviewCount: 0 });
  const [activities, setActivities] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, statsRes, patientsRes, ratingRes, activitiesRes] = await Promise.all([
        doctorApi.getProfile(),
        doctorApi.getAppointmentStats(),
        doctorApi.getPatients(),
        doctorApi.getRatingsSummary(),
        doctorApi.getRecentActivities(),
      ]);
      setProfile(profileRes.data || null);
      setStats(statsRes.data?.stats || { today_appointments: 0 });
      setPatientCount((patientsRes.data?.patients || []).length);
      setRating({
        rating: ratingRes.data?.rating || 0,
        reviewCount: ratingRes.data?.reviewCount || 0,
      });
      setActivities(activitiesRes.data?.activities || []);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingSpinner />;

  const isPending = profile && !profile.approved;
  const isSuspended = profile && Boolean(profile.suspended);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[colors.primary]} />}
      >
        {isPending && (
          <View style={[styles.alert, styles.alertWarning]}>
            <Ionicons name="time" size={20} color={colors.warning} />
            <Text style={styles.alertText}>Your account is pending admin approval</Text>
          </View>
        )}
        {isSuspended && (
          <View style={[styles.alert, styles.alertError]}>
            <Ionicons name="ban" size={20} color={colors.error} />
            <Text style={styles.alertText}>Your account has been suspended</Text>
          </View>
        )}

        <Text style={styles.greeting}>Dr. {String(profile?.full_name || 'Doctor')}</Text>
        <Text style={styles.subGreeting}>{String(profile?.specialty || 'Healthcare Professional')}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="today" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{stats.today_appointments}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{patientCount}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color={colors.warning} />
            <Text style={styles.statNumber}>{Number(rating.rating).toFixed(1)}</Text>
            <Text style={styles.statLabel}>{rating.reviewCount} reviews</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Activities</Text>
        {activities.length === 0 ? (
          <Text style={styles.emptyText}>No recent activities</Text>
        ) : (
          activities.slice(0, 5).map((activity, idx) => (
            <View key={idx} style={styles.activityCard}>
              <Ionicons name="ellipse" size={8} color={colors.primary} />
              <Text style={styles.activityText}>{String(activity.message || activity.description || 'Activity')}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  alert: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  alertWarning: { backgroundColor: '#FEF3C7' },
  alertError: { backgroundColor: '#FEE2E2' },
  alertText: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
  greeting: { fontSize: 26, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: spacing.xs },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  activityCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.white, padding: spacing.md, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
  activityText: { fontSize: 14, color: colors.text, flex: 1 },
  emptyText: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
});

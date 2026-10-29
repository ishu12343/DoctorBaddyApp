import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { DoctorTabParamList } from '../../navigation/types';
import { doctorApi } from '../../services/doctorApi';
import { getErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { API_BASE_URL } from '../../config/api';

export default function DoctorHomeScreen() {
  const navigation = useNavigation<NavigationProp<DoctorTabParamList>>();
  const { logout } = useAuth();
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

  const handleLogout = async () => {
    console.log('DoctorHomeScreen handleLogout called');
    console.log('Calling logout directly');
    await logout();
  };

  const getProfilePhotoUrl = (photo: string | null | undefined): string => {
    if (!photo) {
      return 'https://via.placeholder.com/50';
    }
    // Handle JSON format with base64 data
    try {
      const parsed = JSON.parse(photo);
      if (typeof parsed === 'object' && parsed !== null) {
        const values = Object.values(parsed);
        if (values.length > 0 && typeof values[0] === 'string' && values[0].startsWith('data:')) {
          console.log('DoctorHomeScreen: Extracted base64 photo from JSON');
          return values[0];
        }
      }
    } catch (e) {
      // Not JSON, check for custom format: {filename=data:image/...}
      if (photo.startsWith('{') && photo.includes('=') && photo.includes('data:')) {
        const match = photo.match(/=([^}]+)/);
        if (match && match[1] && match[1].startsWith('data:')) {
          console.log('DoctorHomeScreen: Extracted base64 photo from custom format');
          return match[1];
        }
      }
      console.log('DoctorHomeScreen: Photo is not JSON format', photo.substring(0, 50));
    }
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    return `${API_BASE_URL}uploads/${photo}`;
  };

  if (loading) return <LoadingSpinner />;

  const isPending = profile && !profile.approved;
  const isSuspended = profile && Boolean(profile.suspended);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[colors.primary]} />}
      >
        {isPending ? (
          <View style={[styles.alert, styles.alertWarning]}>
            <Ionicons name="time" size={20} color={colors.warning} />
            <Text style={styles.alertText}>Your account is pending admin approval</Text>
          </View>
        ) : null}
        {isSuspended ? (
          <View style={[styles.alert, styles.alertError]}>
            <Ionicons name="ban" size={20} color={colors.error} />
            <Text style={styles.alertText}>Your account has been suspended</Text>
          </View>
        ) : null}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: getProfilePhotoUrl(profile?.profile_photo as string | null | undefined) }}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.greeting}>Dr. {String(profile?.full_name || 'Doctor')}</Text>
              <Text style={styles.subGreeting}>{String(profile?.specialty || 'Healthcare Professional')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutIconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

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

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('DoctorAppointments')}>
            <Ionicons name="calendar-outline" size={28} color={colors.primary} />
            <Text style={styles.actionText}>Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('DoctorPatients')}>
            <Ionicons name="people-outline" size={28} color={colors.primary} />
            <Text style={styles.actionText}>Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('DoctorProfile')}>
            <Ionicons name="person-outline" size={28} color={colors.primary} />
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Activities</Text>
        {activities.length === 0 ? (
          <Text style={styles.emptyText}>No recent activities</Text>
        ) : (
          activities.slice(0, 5).map((activity, idx) => (
            <View key={idx} style={styles.activityCard}>
              <Ionicons name="ellipse" size={8} color={colors.primary} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  {activity.patient_name ? `${String(activity.patient_name)} - ` : ''}
                  {activity.action_type || activity.activity_type || 'Activity'}
                </Text>
                {activity.reason ? <Text style={styles.activitySubtext}>Reason: {String(activity.reason)}</Text> : null}
                {activity.status ? <Text style={styles.activitySubtext}>Status: {String(activity.status)}</Text> : null}
                <Text style={styles.activityTime}>{String(activity.appointment_datetime || activity.created_at)}</Text>
              </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
  },
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
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: spacing.xs },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  activityCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.white, padding: spacing.md, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, fontWeight: '600', color: colors.text },
  activitySubtext: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  activityTime: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  emptyText: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
});

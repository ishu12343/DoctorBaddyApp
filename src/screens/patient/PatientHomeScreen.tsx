import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { PatientTabParamList } from '../../navigation/types';
import { patientApi } from '../../services/patientApi';
import { getErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import SpecialtyCard from '../../components/SpecialtyCard';
import DoctorCard from '../../components/DoctorCard';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function PatientHomeScreen() {
  const navigation = useNavigation<NavigationProp<PatientTabParamList>>();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Record<string, string> | null>(null);
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const specialties = [
    { icon: 'medkit-outline' as const, name: 'General Physician' },
    { icon: 'heart-outline' as const, name: 'Cardiologist' },
    { icon: 'medical-outline' as const, name: 'Dentist' },
    { icon: 'happy-outline' as const, name: 'Pediatrician' },
    { icon: 'woman-outline' as const, name: 'Gynecologist' },
    { icon: 'person-outline' as const, name: 'Dermatologist' },
    { icon: 'accessibility-outline' as const, name: 'Orthopedic' },
    { icon: 'pulse-outline' as const, name: 'Neurologist' },
  ];

  const topDoctors = [
    { id: 1, name: 'Dr. Ishwar Parmar', specialty: 'Cardiologist', rating: 4.8, experience: '15 years', fee: '$50' },
    { id: 2, name: 'Dr. Sarah Johnson', specialty: 'Dermatologist', rating: 4.9, experience: '12 years', fee: '$45' },
    { id: 3, name: 'Dr. Michael Chen', specialty: 'General Physician', rating: 4.7, experience: '10 years', fee: '$40' },
  ];

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
            <Text style={styles.subGreeting}>Find your doctor and book appointment</Text>
          </View>
          <TouchableOpacity style={styles.logoutIconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors, specialties..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Consult with a Doctor</Text>
              <Text style={styles.bannerSubtitle}>Get expert advice from top doctors</Text>
              <TouchableOpacity style={styles.bannerButton} onPress={() => navigation.navigate('PatientDoctors')}>
                <Text style={styles.bannerButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="medical" size={60} color="rgba(255,255,255,0.3)" />
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Top Specialties</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtiesScroll}>
          {specialties.map((specialty, index) => (
            <SpecialtyCard
              key={index}
              icon={specialty.icon}
              name={specialty.name}
              onPress={() => navigation.navigate('PatientDoctors')}
            />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Top Doctors</Text>
        {topDoctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            name={doctor.name}
            specialty={doctor.specialty}
            rating={doctor.rating}
            experience={doctor.experience}
            fee={doctor.fee}
            onPress={() => navigation.navigate('PatientDoctors')}
          />
        ))}

        {appointments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {appointments.map((appt: Record<string, unknown>, idx: number) => (
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
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
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
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  banner: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerText: { flex: 1 },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.md,
  },
  bannerButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  specialtiesScroll: {
    marginBottom: spacing.lg,
  },
  apptCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  apptDoctor: { fontSize: 16, fontWeight: '600', color: colors.text },
  apptDate: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  apptStatus: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 4 },
});

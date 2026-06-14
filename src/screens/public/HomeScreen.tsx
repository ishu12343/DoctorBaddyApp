import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import AppButton from '../../components/AppButton';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { PublicStackParamList } from '../../navigation/types';
import apiClient from '../../services/apiClient';
import { API_BASE_URL } from '../../config/api';

interface Doctor {
  id: number;
  full_name: string;
  specialty: string;
  average_rating: number;
  total_reviews: number;
  experience: string;
  consultation_fee: number;
  profile_photo: string;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const stackNav = navigation.getParent<NativeStackNavigationProp<PublicStackParamList>>();
  const [topRatedDoctors, setTopRatedDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const goTo = (screen: keyof PublicStackParamList) => {
    stackNav?.navigate(screen);
  };

  const formatExperience = (experience: string | number): string => {
    if (typeof experience === 'number') {
      return `${experience}+yr`;
    }
    // If it's a string, check if it's just a number
    const num = parseInt(experience);
    if (!isNaN(num)) {
      return `${num}+yr`;
    }
    // If it already has text, return as is
    return experience;
  };

  const getProfilePhotoUrl = (photo: string | null | undefined): string => {
    if (!photo) {
      return 'https://via.placeholder.com/48';
    }
    // If it's already a full URL, return as is
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    // Otherwise, construct the full URL using the backend base URL
    // Assuming images are stored in an 'uploads' directory
    return `${API_BASE_URL}uploads/${photo}`;
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('api/patient/doctors');
      const doctors = response.data.doctors || [];
      // Sort by rating and take top 3
      const sortedDoctors = doctors
        .sort((a: Doctor, b: Doctor) => b.average_rating - a.average_rating)
        .slice(0, 3);
      setTopRatedDoctors(sortedDoctors);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      // Fallback to hardcoded data if API fails
      setTopRatedDoctors([
        {
          id: 1,
          full_name: 'Dr. Sarah Johnson',
          specialty: 'Cardiologist',
          average_rating: 4.9,
          total_reviews: 120,
          experience: '15+ years',
          consultation_fee: 50,
          profile_photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
        },
        {
          id: 2,
          full_name: 'Dr. Michael Chen',
          specialty: 'Dermatologist',
          average_rating: 4.8,
          total_reviews: 95,
          experience: '12+ years',
          consultation_fee: 45,
          profile_photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face',
        },
        {
          id: 3,
          full_name: 'Dr. Emily Rodriguez',
          specialty: 'Pediatrician',
          average_rating: 4.9,
          total_reviews: 150,
          experience: '18+ years',
          consultation_fee: 55,
          profile_photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop&crop=face',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.brand}>DoctorBuddy</Text>
            <Text style={styles.tagline}>Your health, your way</Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>
              Online doctor visits,{'\n'}
              <Text style={styles.heroHighlight}>made simple</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Connect with qualified healthcare professionals from the comfort of your home.
            </Text>
            <AppButton
              title="Get Started"
              onPress={() => goTo('PatientLogin')}
              style={styles.heroButton}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Doctors</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Top Rated Doctors</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading doctors...</Text>
          ) : (
            topRatedDoctors.map((doctor) => (
              <View key={doctor.id} style={styles.doctorCard}>
                <Image
                  source={{ uri: getProfilePhotoUrl(doctor.profile_photo) }}
                  style={styles.doctorImage}
                />
                <View style={styles.doctorContent}>
                  <Text style={styles.doctorName}>{doctor.full_name} ({formatExperience(doctor.experience)})</Text>
                  <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                  <View style={styles.doctorMeta}>
                    <View style={styles.doctorRating}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.ratingText}>{doctor.average_rating}/5 ({doctor.total_reviews})</Text>
                    </View>
                    <Text style={styles.doctorFee}>${doctor.consultation_fee}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.bookIconButton} onPress={() => goTo('PatientLogin')}>
                  <Ionicons name="calendar" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={styles.loginSection}>
            <Text style={styles.loginTitle}>Login as</Text>
            <View style={styles.loginButtons}>
              <TouchableOpacity
                style={styles.loginCard}
                onPress={() => goTo('PatientLogin')}
              >
                <Ionicons name="person" size={28} color={colors.primary} />
                <Text style={styles.loginCardText}>Patient</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginCard}
                onPress={() => goTo('DoctorLogin')}
              >
                <Ionicons name="medkit" size={28} color={colors.primary} />
                <Text style={styles.loginCardText}>Doctor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginCard}
                onPress={() => goTo('AdminLogin')}
              >
                <Ionicons name="shield" size={28} color={colors.primary} />
                <Text style={styles.loginCardText}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.md },
  brand: { fontSize: 32, fontWeight: '800', color: colors.white },
  tagline: { fontSize: 16, color: colors.white, opacity: 0.9, marginTop: 4 },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.text, lineHeight: 32 },
  heroHighlight: { color: colors.primary },
  heroSubtitle: { fontSize: 15, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 },
  heroButton: { marginTop: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: { fontSize: 20, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  doctorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  doctorContent: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '600', color: colors.text },
  doctorSpecialty: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  doctorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: { fontSize: 12, fontWeight: '600', color: colors.text },
  doctorExperience: { fontSize: 12, color: colors.textSecondary },
  doctorFee: { fontSize: 12, fontWeight: '600', color: colors.primary },
  bookIconButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  loginSection: { marginTop: spacing.lg },
  loginTitle: { fontSize: 18, fontWeight: '600', color: colors.white, textAlign: 'center', marginBottom: spacing.md },
  loginButtons: { flexDirection: 'row', gap: spacing.sm },
  loginCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  loginCardText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  loadingText: { fontSize: 14, color: colors.white, textAlign: 'center', padding: spacing.md },
});

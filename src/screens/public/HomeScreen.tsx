import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import AppButton from '../../components/AppButton';
import DoctorCard from '../../components/DoctorCard';
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
  const tabNavigation = useNavigation();
  const stackNav = navigation.getParent<NativeStackNavigationProp<PublicStackParamList>>();
  const [topRatedDoctors, setTopRatedDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');

  const specialties = [
    'All',
    'Cardiologist',
    'Dentist',
    'Pediatrician',
    'Gynecologist',
    'Dermatologist',
    'Orthopedic',
    'Neurologist',
    'General Physician',
  ];

  const goTo = (screen: keyof PublicStackParamList) => {
    stackNav?.navigate(screen);
  };

  const formatExperience = (experience: string | number): string => {
    if (typeof experience === 'number') {
      return `${experience}+ yr`;
    }
    // If it's a string, check if it's just a number
    const num = parseInt(experience);
    if (!isNaN(num)) {
      return `${num}+ yr`;
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

  useEffect(() => {
    filterDoctors();
  }, [searchName, searchLocation, selectedSpecialty, topRatedDoctors]);

  const filterDoctors = () => {
    let filtered = topRatedDoctors;

    if (selectedSpecialty !== 'All') {
      filtered = filtered.filter(
        (doctor) => doctor.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
      );
    }

    if (searchName) {
      filtered = filtered.filter(
        (doctor) => doctor.full_name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchLocation) {
      filtered = filtered.filter(
        (doctor) => doctor.clinic_address?.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleSearch = () => {
    filterDoctors();
  };

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('api/patient/doctors');
      const doctors = response.data.doctors || [];
      // Sort by rating and take all doctors for filtering
      const sortedDoctors = doctors.sort((a: Doctor, b: Doctor) => b.average_rating - a.average_rating);
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
          clinic_address: 'New York, NY',
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
          clinic_address: 'Los Angeles, CA',
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
          clinic_address: 'Chicago, IL',
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

          <View style={styles.searchSection}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search doctors, specialties..."
                placeholderTextColor={colors.textSecondary}
                value={searchName}
                onChangeText={setSearchName}
              />
            </View>

            <View style={styles.searchRow}>
              <View style={styles.locationDropdownContainer}>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Search docotor clinc & hospital Location"
                  placeholderTextColor={colors.textSecondary}
                  value={searchLocation}
                  onChangeText={setSearchLocation}
                />
                <Ionicons name="chevron-down-outline" size={20} color={colors.textSecondary} />
              </View>

              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Rated Doctors</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FindDoctorsTab' as never)}>
              <Text style={styles.findDoctorsButtonText}>Find Doctors →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <Text style={styles.loadingText}>Loading doctors...</Text>
          ) : filteredDoctors.length === 0 ? (
            <Text style={styles.noDoctorsText}>No doctors found</Text>
          ) : (
            filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                name={doctor.full_name}
                specialty={doctor.specialty}
                rating={doctor.average_rating}
                experience={formatExperience(doctor.experience)}
                fee={`$${doctor.consultation_fee}`}
                avatar={getProfilePhotoUrl(doctor.profile_photo)}
                location={doctor.clinic_address}
                reviews={doctor.total_reviews}
                onPress={() => goTo('PatientLogin')}
                showBookButton={true}
                onBookNow={() => goTo('PatientLogin')}
              />
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
  searchSection: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationDropdownContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    width: '100%',
  },
  findDoctorsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    textDecorationLine: 'underline',
  },
  loadingText: { fontSize: 14, color: colors.white, textAlign: 'center', padding: spacing.md },
  noDoctorsText: { fontSize: 14, color: colors.white, textAlign: 'center', padding: spacing.md },
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
});

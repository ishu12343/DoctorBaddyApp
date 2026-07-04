import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DoctorCard from '../../components/DoctorCard';
import { colors, spacing, borderRadius } from '../../constants/theme';
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
  location?: string;
}

export default function AllDoctorsScreen() {
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
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

  const formatExperience = (experience: string | number): string => {
    if (typeof experience === 'number') {
      return `${experience}+yr`;
    }
    const num = parseInt(experience);
    if (!isNaN(num)) {
      return `${num}+yr`;
    }
    return experience;
  };

  const getProfilePhotoUrl = (photo: string | null | undefined): string => {
    if (!photo) {
      return 'https://via.placeholder.com/48';
    }
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    return `${API_BASE_URL}uploads/${photo}`;
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [selectedSpecialty, searchName, searchLocation, doctors]);

  const filterDoctors = () => {
    let filtered = doctors;

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

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('api/patient/doctors');
      const doctors = response.data.doctors || [];
      const sortedDoctors = doctors.sort((a: Doctor, b: Doctor) => b.average_rating - a.average_rating);
      setDoctors(sortedDoctors);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by doctor name"
              placeholderTextColor={colors.textSecondary}
              value={searchName}
              onChangeText={setSearchName}
            />
          </View>

          <View style={styles.searchInputContainer}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by location"
              placeholderTextColor={colors.textSecondary}
              value={searchLocation}
              onChangeText={setSearchLocation}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Filter by Specialty</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtiesScroll}>
          {specialties.map((specialty, index) => (
            <TouchableOpacity key={index} onPress={() => setSelectedSpecialty(specialty)}>
              <View
                style={[
                  styles.specialtyChip,
                  selectedSpecialty === specialty && styles.specialtyChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.specialtyChipText,
                    selectedSpecialty === specialty && styles.specialtyChipTextActive,
                  ]}
                >
                  {specialty}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>
          {selectedSpecialty === 'All' ? 'All Doctors' : `${selectedSpecialty} Doctors`}
          {filteredDoctors.length > 0 && ` (${filteredDoctors.length})`}
        </Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading doctors...</Text>
        ) : filteredDoctors.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No doctors found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search filters</Text>
          </View>
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
              showBookButton={true}
              onBookNow={() => {}}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  searchSection: {
    marginBottom: spacing.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  specialtiesScroll: {
    marginBottom: spacing.lg,
  },
  specialtyChip: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specialtyChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  specialtyChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  specialtyChipTextActive: {
    color: colors.white,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

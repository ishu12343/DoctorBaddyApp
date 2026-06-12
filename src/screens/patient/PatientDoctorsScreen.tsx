import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { patientApi } from '../../services/patientApi';
import { getErrorMessage } from '../../services/apiClient';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface Doctor {
  id: number;
  full_name?: string;
  specialty?: string;
  city?: string;
  location?: string;
  experience?: number;
  rating?: number;
}

export default function PatientDoctorsScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookReason, setBookReason] = useState('');
  const [booking, setBooking] = useState(false);

  const loadDoctors = useCallback(async () => {
    try {
      const res = await patientApi.getDoctors({
        search: search || undefined,
        specialty: specialty || undefined,
        city: city || undefined,
      });
      setDoctors(res.data?.doctors || []);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, specialty, city]);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);

  const handleBook = async () => {
    if (!selectedDoctor || !bookDate || !bookTime || !bookReason) {
      Alert.alert('Error', 'Please fill all booking fields');
      return;
    }
    setBooking(true);
    try {
      const res = await patientApi.bookAppointment({
        doctor_id: selectedDoctor.id,
        appointment_date: bookDate,
        appointment_time: bookTime,
        reason: bookReason,
      });
      Alert.alert('Success', `Appointment booked with ${res.data?.doctor_name || 'doctor'}`);
      setSelectedDoctor(null);
      setBookDate('');
      setBookTime('');
      setBookReason('');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchSection}>
        <AppInput placeholder="Search doctors..." value={search} onChangeText={setSearch} containerStyle={styles.searchInput} />
        <View style={styles.filterRow}>
          <AppInput placeholder="Specialty" value={specialty} onChangeText={setSpecialty} containerStyle={styles.filterInput} />
          <AppInput placeholder="City" value={city} onChangeText={setCity} containerStyle={styles.filterInput} />
        </View>
        <AppButton title="Search" onPress={loadDoctors} style={styles.searchBtn} />
      </View>

      <FlatList
        data={doctors}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="medical-outline" title="No doctors found" message="Try adjusting your search filters" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Ionicons name="medkit" size={24} color={colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.name}>{item.full_name || 'Doctor'}</Text>
                <Text style={styles.specialty}>{item.specialty || 'General'}</Text>
                <Text style={styles.location}>
                  <Ionicons name="location-outline" size={12} /> {item.city || item.location || 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.exp}>{item.experience || 0} yrs exp</Text>
              <AppButton title="Book" onPress={() => setSelectedDoctor(item)} style={styles.bookBtn} />
            </View>
          </View>
        )}
      />

      <Modal visible={!!selectedDoctor} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <Text style={styles.modalDoctor}>Dr. {selectedDoctor?.full_name}</Text>
            <AppInput label="Date (YYYY-MM-DD)" value={bookDate} onChangeText={setBookDate} placeholder="2026-06-15" />
            <AppInput label="Time (HH:MM)" value={bookTime} onChangeText={setBookTime} placeholder="10:00" />
            <AppInput label="Reason" value={bookReason} onChangeText={setBookReason} multiline />
            <View style={styles.modalButtons}>
              <AppButton title="Cancel" variant="outline" onPress={() => setSelectedDoctor(null)} style={styles.modalBtn} />
              <AppButton title="Confirm" onPress={handleBook} loading={booking} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchSection: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { marginBottom: spacing.sm },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterInput: { flex: 1, marginBottom: spacing.sm },
  searchBtn: { marginTop: spacing.xs },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  specialty: { fontSize: 14, color: colors.primary, marginTop: 2 },
  location: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  exp: { fontSize: 13, color: colors.textSecondary },
  bookBtn: { paddingHorizontal: spacing.lg, minHeight: 36 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  modalDoctor: { fontSize: 15, color: colors.primary, marginBottom: spacing.lg },
  modalButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1 },
});

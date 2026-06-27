import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  available_days?: string;
  available_from?: string;
  available_to?: string;
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      if (isDayAvailable(selectedDate)) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        setBookDate(dateStr);
      } else {
        Alert.alert('Invalid Date', `Doctor is not available on this day. Available days: ${selectedDoctor?.available_days}`);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      if (selectedDoctor?.available_from && selectedDoctor?.available_to) {
        const fromTime = parseInt(selectedDoctor.available_from.replace(':', ''));
        const toTime = parseInt(selectedDoctor.available_to.replace(':', ''));
        const selectedTimeNum = parseInt(timeStr.replace(':', ''));
        
        if (selectedTimeNum < fromTime || selectedTimeNum > toTime) {
          Alert.alert('Invalid Time', `Please select a time between ${selectedDoctor.available_from} and ${selectedDoctor.available_to}`);
          return;
        }
      }
      
      setBookTime(timeStr);
    }
  };

  const isDayAvailable = (date: Date): boolean => {
    if (!selectedDoctor?.available_days) return true;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    return selectedDoctor.available_days.includes(dayName);
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
            {Platform.OS === 'web' ? (
              <>
                <View style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>Date:</Text>
                  <input 
                    type="date" 
                    value={bookDate} 
                    onChange={(e: any) => {
                      const selectedDate = new Date(e.target.value);
                      if (isDayAvailable(selectedDate)) {
                        setBookDate(e.target.value);
                      } else {
                        Alert.alert('Invalid Date', `Doctor is not available on this day. Available days: ${selectedDoctor?.available_days}`);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    style={styles.webInput}
                  />
                </View>
                <View style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>Time:</Text>
                  <input 
                    type="time" 
                    value={bookTime} 
                    onChange={(e: any) => {
                      const timeStr = e.target.value;
                      if (selectedDoctor?.available_from && selectedDoctor?.available_to) {
                        const fromTime = parseInt(selectedDoctor.available_from.replace(':', ''));
                        const toTime = parseInt(selectedDoctor.available_to.replace(':', ''));
                        const selectedTimeNum = parseInt(timeStr.replace(':', ''));
                        
                        if (selectedTimeNum < fromTime || selectedTimeNum > toTime) {
                          Alert.alert('Invalid Time', `Please select a time between ${selectedDoctor.available_from} and ${selectedDoctor.available_to}`);
                          return;
                        }
                      }
                      setBookTime(timeStr);
                    }}
                    style={styles.webInput}
                  />
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>Date:</Text>
                  <Text style={styles.pickerValue}>{bookDate || 'Select Date'}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={bookDate ? new Date(bookDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    style={{ width: '100%' }}
                  />
                )}
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>Time:</Text>
                  <Text style={styles.pickerValue}>{bookTime || 'Select Time'}</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={bookTime ? new Date(`2000-01-01T${bookTime}`) : new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    style={{ width: '100%' }}
                  />
                )}
              </>
            )}
            <AppInput label="Reason" value={bookReason} onChangeText={setBookReason} multiline />
            <View style={styles.modalButtons}>
              <AppButton title="Cancel" variant="outline" onPress={() => {
                setSelectedDoctor(null);
                setBookDate('');
                setBookTime('');
                setBookReason('');
              }} style={styles.modalBtn} />
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
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  pickerLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  pickerValue: { fontSize: 14, color: colors.primary },
  webInput: { padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14, minWidth: 150 },
});

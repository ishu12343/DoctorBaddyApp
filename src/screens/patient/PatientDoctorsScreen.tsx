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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { patientApi } from '../../services/patientApi';
import { getErrorMessage } from '../../services/apiClient';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import DoctorCard from '../../components/DoctorCard';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { API_BASE_URL } from '../../config/api';
import { PatientTabParamList } from '../../navigation/types';

interface Doctor {
  id: number;
  full_name?: string;
  specialty?: string;
  city?: string;
  location?: string;
  experience?: string;
  rating?: number;
  average_rating?: number;
  total_reviews?: number;
  consultation_fee?: number;
  profile_photo?: string;
  clinic_address?: string;
  available_days?: string;
  available_from?: string;
  available_to?: string;
}

export default function PatientDoctorsScreen() {
  const route = useRoute<RouteProp<PatientTabParamList, 'PatientDoctors'>>();
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [patientAddress, setPatientAddress] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookReason, setBookReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [webDateError, setWebDateError] = useState('');
  const [validationModal, setValidationModal] = useState({ visible: false, message: '' });

  const loadDoctors = useCallback(async () => {
    try {
      // Get patient's location details from profile
      const profileRes = await patientApi.getProfile();
      const addressFromProfile = profileRes.data?.patient?.address;
      const cityFromProfile = profileRes.data?.patient?.city;
      setPatientAddress(addressFromProfile ? addressFromProfile.trim().toLowerCase() : '');

      // Fetch doctors with optional filters
      const res = await patientApi.getDoctors({
        search: search || undefined,
        specialty: specialty || undefined,
        city: city || undefined,
        patient_address: addressFromProfile ? addressFromProfile.trim().toLowerCase() : undefined,
        patient_city: cityFromProfile ? cityFromProfile.trim().toLowerCase() : undefined,
      });
      const allDoctors = res.data?.doctors || [];

      // Only sort by patient's address if no manual city filter is applied
      if (!city) {
        const sortedDoctors = [...allDoctors].sort((a, b) => {
          const aAddress = (a.clinic_address || a.location || '').trim().toLowerCase();
          const bAddress = (b.clinic_address || b.location || '').trim().toLowerCase();
          const pAddress = patientAddress || '';

          // If both match patient's address, maintain original order
          if (aAddress.includes(pAddress) && bAddress.includes(pAddress)) return 0;
          // If a matches patient's address, it comes first
          if (aAddress.includes(pAddress)) return -1;
          // If b matches patient's address, it comes first
          if (bAddress.includes(pAddress)) return 1;
          // Otherwise maintain original order
          return 0;
        });
        setDoctors(sortedDoctors);
      } else {
        setDoctors(allDoctors);
      }
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, specialty, city, patientAddress]);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);

  useEffect(() => {
    if (route.params?.preselectedDoctor) {
      setSelectedDoctor(route.params.preselectedDoctor as Doctor);
      // Clear the param after using it
      navigation.setParams({ preselectedDoctor: undefined });
    }
  }, [route.params?.preselectedDoctor, navigation]);

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
      setSelectedTimeSlot('');
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
    // Android may send event.type === 'dismissed'
    if (event?.type === 'dismissed') return;

    let picked = selectedDate;
    if (!picked && event?.nativeEvent?.timestamp) {
      picked = new Date(event.nativeEvent.timestamp);
    }
    if (!picked) return;

    if (isDayAvailable(picked)) {
      const dateStr = picked.toISOString().split('T')[0];
      setBookDate(dateStr);
    } else {
      const avail = normalizeAvailableDays(selectedDoctor?.available_days).length ? normalizeAvailableDays(selectedDoctor?.available_days).map(d => d.slice(0,3)).join(', ') : String(selectedDoctor?.available_days || '');
      Alert.alert('Invalid Date', `Doctor is not available on this day please select. Available days: ${avail}`);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      if (selectedDoctor?.available_from && selectedDoctor?.available_to) {
        const fromTime = parseInt(selectedDoctor.available_from.trim().replace(':', ''));
        const toTime = parseInt(selectedDoctor.available_to.trim().replace(':', ''));
        const selectedTimeNum = parseInt(timeStr.replace(':', ''));

        if (selectedTimeNum < fromTime || selectedTimeNum > toTime) {
          Alert.alert('Invalid Time', `Please select a time between ${selectedDoctor.available_from.trim()} and ${selectedDoctor.available_to.trim()}`);
          return;
        }
      }
      
      setBookTime(timeStr);
    }
  };

  const normalizeAvailableDays = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map(String).map((t) => t.trim()).filter(Boolean).map((t) => {
        const v = t.toLowerCase();
        if (v.startsWith('sun')) return 'Sunday';
        if (v.startsWith('mon')) return 'Monday';
        if (v.startsWith('tue')) return 'Tuesday';
        if (v.startsWith('wed')) return 'Wednesday';
        if (v.startsWith('thu')) return 'Thursday';
        if (v.startsWith('fri')) return 'Friday';
        if (v.startsWith('sat')) return 'Saturday';
        return t;
      });
    }

    // split on commas, pipes, slashes, dashes or whitespace
    const parts = String(raw).split(/[,\s;|\/\\\-]+/).map((s) => s.trim()).filter(Boolean);
    return parts.map((t) => {
      const v = t.toLowerCase();
      if (v.startsWith('sun')) return 'Sunday';
      if (v.startsWith('mon')) return 'Monday';
      if (v.startsWith('tue')) return 'Tuesday';
      if (v.startsWith('wed')) return 'Wednesday';
      if (v.startsWith('thu')) return 'Thursday';
      if (v.startsWith('fri')) return 'Friday';
      if (v.startsWith('sat')) return 'Saturday';
      return t;
    });
  };

  const isDayAvailable = (date: Date): boolean => {
    const raw = selectedDoctor?.available_days;
    console.log('isDayAvailable - raw available_days:', raw);
    console.log('isDayAvailable - selected date:', date);
    console.log('isDayAvailable - date.getDay():', date.getDay());
    if (!raw) return true;
    const allowed = new Set(normalizeAvailableDays(raw));
    console.log('isDayAvailable - normalized allowed days:', allowed);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    console.log('isDayAvailable - dayName:', dayName);
    console.log('isDayAvailable - is allowed:', allowed.has(dayName));
    return allowed.has(dayName);
  };

  const formatExperience = (experience: string | number | undefined): string => {
    if (!experience) return '0+ yr';
    if (typeof experience === 'number') {
      return `${experience}+ yr`;
    }
    const num = parseInt(experience);
    if (!isNaN(num)) {
      return `${num}+ yr`;
    }
    return experience;
  };

  const parseTimeTo24Hour = (timeStr: string): { hour: number; min: number } => {
    const trimmed = timeStr.trim().toLowerCase();
    const [timePart, period] = trimmed.split(' ');
    const [hourStr, minStr] = timePart.split(':');
    let hour = parseInt(hourStr);
    const min = parseInt(minStr) || 0;

    // Handle 12-hour format with AM/PM
    if (period === 'pm' && hour !== 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;

    // If no period specified and hour is less than fromTime, assume PM
    // This handles cases like "10:00" to "2:00" meaning 10 AM to 2 PM
    return { hour, min };
  };

  const generateTimeSlots = (fromTime: string, toTime: string): string[] => {
    const slots: string[] = [];
    const { hour: fromHour, min: fromMin } = parseTimeTo24Hour(fromTime);
    const { hour: toHour, min: toMin } = parseTimeTo24Hour(toTime);

    // Validate that times are valid numbers
    if (isNaN(fromHour) || isNaN(fromMin) || isNaN(toHour) || isNaN(toMin)) {
      console.error('Invalid time format:', { fromTime, toTime });
      return slots;
    }

    // If toTime is before fromTime, assume toTime is PM
    let adjustedToHour = toHour;
    let adjustedToMin = toMin;
    const fromMinutes = fromHour * 60 + fromMin;
    let toMinutes = toHour * 60 + toMin;

    if (toMinutes <= fromMinutes) {
      // Assume toTime is in the afternoon (add 12 hours)
      adjustedToHour = toHour + 12;
      toMinutes = adjustedToHour * 60 + adjustedToMin;
    }

    let currentHour = fromHour;
    let currentMin = fromMin;

    while (true) {
      const currentMinutes = currentHour * 60 + currentMin;
      if (currentMinutes >= toMinutes) break;

      const nextMinutes = currentMinutes + 15;
      if (nextMinutes > toMinutes) break;

      const nextHour = Math.floor(nextMinutes / 60);
      const nextMin = nextMinutes % 60;

      const formatTime = (h: number, m: number) => {
        const period = h >= 12 ? 'pm' : 'am';
        const hour12 = h % 12 || 12;
        const minStr = m.toString().padStart(2, '0');
        return `${hour12}:${minStr}${period}`;
      };

      const startTime = formatTime(currentHour, currentMin);
      const endTime = formatTime(nextHour, nextMin);
      slots.push(`${startTime}-${endTime}`);

      currentHour = nextHour;
      currentMin = nextMin;
    }

    return slots;
  };

  const formatTimeSlotTo24Hour = (slot: string): string => {
    const [startTime] = slot.split('-');
    const [time, period] = startTime.replace('pm', '').replace('am', '').split(':');
    let hour = parseInt(time);
    const min = parseInt(time.split(':')[1] || '0');
    
    if (period === 'pm' && hour !== 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };

  // Return available dates (YYYY-MM-DD) for the selected doctor for the next `monthsAhead`
  const getAvailableDatesForDoctor = (doctor: any, monthsAhead = 3): string[] => {
    const dates: string[] = [];
    if (!doctor) return dates;
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + monthsAhead);

    for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
      // create a copy to avoid mutation issues
      const copy = new Date(d);
      if (isDayAvailable(copy)) {
        dates.push(copy.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const formatDateDisplay = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${d.toLocaleDateString()}`;
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

  if (loading) return <LoadingSpinner />;

  const bookingAvailableDays = normalizeAvailableDays(selectedDoctor?.available_days);
  const bookingAvailableDisplay = bookingAvailableDays.length ? bookingAvailableDays.map(d=>d.slice(0,3)).join(', ') : 'Any day';

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
          <DoctorCard
            name={item.full_name || 'Doctor'}
            specialty={item.specialty || 'General'}
            rating={item.average_rating || item.rating || 0}
            experience={formatExperience(item.experience)}
            fee={`$${item.consultation_fee || 0}`}
            avatar={getProfilePhotoUrl(item.profile_photo)}
            location={item.clinic_address || item.location || item.city || 'N/A'}
            reviews={item.total_reviews || 0}
            onPress={() => setSelectedDoctor(item)}
            showBookButton={true}
            onBookNow={() => setSelectedDoctor(item)}
          />
        )}
      />

      <Modal visible={!!selectedDoctor} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <Text style={styles.modalDoctor}>Dr. {selectedDoctor?.full_name}</Text>
            <Text style={styles.availabilityText}>Available: {bookingAvailableDisplay}</Text>
            {Platform.OS === 'web' ? (
              <>
                <View style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>Date:</Text>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e: any) => {
                      const val = e.target.value;
                      console.log('Web date input - val:', val);
                      const parts = val ? val.split('-').map(Number) : [];
                      console.log('Web date input - parts:', parts);
                      const selectedDate = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(val);
                      console.log('Web date input - selectedDate:', selectedDate);
                      console.log('Web date input - selectedDoctor:', selectedDoctor);
                      console.log('Web date input - available_days:', selectedDoctor?.available_days);
                      if (isDayAvailable(selectedDate)) {
                        console.log('Web date input - day is available, setting bookDate');
                        setBookDate(val);
                      } else {
                        console.log('Web date input - day is NOT available, showing alert');
                        const avail = normalizeAvailableDays(selectedDoctor?.available_days).length ? normalizeAvailableDays(selectedDoctor?.available_days).map(d=>d.slice(0,3)).join(', ') : String(selectedDoctor?.available_days || '');
                        if (Platform.OS === 'web') {
                          window.alert(`Doctor is not available on this day. Available days: ${avail}`);
                        } else {
                          Alert.alert('Invalid Date', `Doctor is not available on this day. Available days: ${avail}`);
                        }
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
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
              </>
            )}

            {selectedDoctor?.available_from && selectedDoctor?.available_to && (
              <View style={styles.timeSlotContainer}>
                <Text style={styles.timeSlotLabel}>Available Time Slots:</Text>
                <View style={styles.timeSlotGrid}>
                  {generateTimeSlots(selectedDoctor.available_from, selectedDoctor.available_to).map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.timeSlot,
                        selectedTimeSlot === slot && styles.timeSlotSelected,
                      ]}
                      onPress={() => {
                        setSelectedTimeSlot(slot);
                        setBookTime(formatTimeSlotTo24Hour(slot));
                      }}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTimeSlot === slot && styles.timeSlotTextSelected,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <AppInput label="Reason" value={bookReason} onChangeText={setBookReason} multiline />
            <View style={styles.modalButtons}>
              <AppButton title="Cancel" variant="outline" onPress={() => {
                setSelectedDoctor(null);
                setBookDate('');
                setBookTime('');
                setBookReason('');
                setSelectedTimeSlot('');
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  modalDoctor: { fontSize: 15, color: colors.primary, marginBottom: spacing.lg },
  modalButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1 },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  pickerLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  pickerValue: { fontSize: 14, color: colors.primary },
  webInput: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 14, minWidth: 150 },
  timeSlotContainer: { marginTop: spacing.md },
  timeSlotLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  timeSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateSlot: { backgroundColor: colors.background, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: '#ddd', marginRight: spacing.sm },
  dateSlotSelected: { backgroundColor: colors.primary },
  dateSlotText: { color: colors.text },
  dateSlotTextSelected: { color: colors.white },
  availabilityText: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  errorText: { color: '#FF3B30', marginTop: 6 },
  timeSlot: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  timeSlotTextSelected: {
    color: colors.white,
  },
});

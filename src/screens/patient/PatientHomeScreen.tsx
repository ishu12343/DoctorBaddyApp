import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Modal, Alert, Platform, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { PatientTabParamList } from '../../navigation/types';
import { patientApi } from '../../services/patientApi';
import { getErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import DoctorCard from '../../components/DoctorCard';
import StatusBadge from '../../components/StatusBadge';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { API_BASE_URL } from '../../config/api';

interface Doctor {
  id: number;
  full_name?: string;
  specialty?: string;
  average_rating?: number;
  total_reviews?: number;
  experience?: string;
  consultation_fee?: number;
  profile_photo?: string;
  clinic_address?: string;
}

export default function PatientHomeScreen() {
  const navigation = useNavigation<NavigationProp<PatientTabParamList>>();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Record<string, string> | null>(null);
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Record<string, unknown> | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<Record<string, unknown> | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [webDateError, setWebDateError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [rescheduledAppts, setRescheduledAppts] = useState<Set<number>>(new Set());

  const formatExperience = (experience: string | number): string => {
    if (typeof experience === 'number') {
      return `${experience}+ yr`;
    }
    const num = parseInt(experience);
    if (!isNaN(num)) {
      return `${num}+ yr`;
    }
    return experience;
  };

  const getProfilePhotoUrl = (photo: string | null | undefined): string => {
    if (!photo) {
      return 'https://via.placeholder.com/48';
    }
    // Handle JSON format with base64 data
    try {
      const parsed = JSON.parse(photo);
      if (typeof parsed === 'object' && parsed !== null) {
        const values = Object.values(parsed);
        if (values.length > 0 && typeof values[0] === 'string' && values[0].startsWith('data:')) {
          return values[0];
        }
      }
    } catch (e) {
      // Not JSON, continue with normal processing
    }
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    return `${API_BASE_URL}uploads/${photo}`;
  };

  const handleBookNow = (doctor: Record<string, unknown>) => {
    // Navigate find doctors and pass the doctor to auto-select for booking
    navigation.navigate('PatientDoctors', { preselectedDoctor: doctor });
  };

  const generateTimeSlots = (fromTime: string, toTime: string): string[] => {
    const slots: string[] = [];
    const [fromHour, fromMin] = fromTime.split(':').map(Number);
    const [toHour, toMin] = toTime.split(':').map(Number);

    let currentHour = fromHour;
    let currentMin = fromMin;
    const toMinutes = toHour * 60 + toMin;

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

  // Available dates for reschedule (next 3 months) based on rescheduleAppt.available_days
  const getAvailableDatesForReschedule = (monthsAhead = 3): string[] => {
    const dates: string[] = [];
    if (!rescheduleAppt) return dates;
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + monthsAhead);

    for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
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

  const loadData = useCallback(async () => {
    try {
      const [profileRes, apptRes] = await Promise.all([
        patientApi.getProfile(),
        patientApi.getAppointments(),
      ]);
      setProfile(profileRes.data?.patient || null);
      setAppointments(apptRes.data?.appointments || []);
      
      // Get patient's location details from profile
      const patientAddress = profileRes.data?.patient?.address;
      const patientCity = profileRes.data?.patient?.city;
      
      // Fetch doctors filtered by patient's address and city (case-insensitive, trim whitespace)
      const doctorsRes = await patientApi.getDoctors({ 
        patient_address: patientAddress ? patientAddress.trim().toLowerCase() : undefined,
        patient_city: patientCity ? patientCity.trim().toLowerCase() : undefined,
      });
      const fetchedDoctors = doctorsRes.data?.doctors || [];
      
      setDoctors(fetchedDoctors);
      setFilteredDoctors(fetchedDoctors);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredDoctors(doctors);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = doctors.filter((doctor) => {
      const nameMatch = doctor.full_name?.toLowerCase().includes(searchLower);
      const specialtyMatch = doctor.specialty?.toLowerCase().includes(searchLower);
      const locationMatch = doctor.clinic_address?.toLowerCase().includes(searchLower);
      return nameMatch || specialtyMatch || locationMatch;
    });
    setFilteredDoctors(filtered);
  }, [searchText, doctors]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleLogout = async () => {
    console.log('PatientHomeScreen handleLogout called');
    console.log('Calling logout directly');
    await logout();
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await patientApi.cancelAppointment(appointmentId);
            const apptRes = await patientApi.getAppointments();
            setAppointments(apptRes.data?.appointments || []);
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const handleReschedule = async () => {
    if (!rescheduleAppt || !newDate || !newTime) return;
    setActionLoading(true);
    try {
      const status = String(rescheduleAppt.status || '').toUpperCase();
      
      if (status === 'PENDING') {
        // Try to update existing booking for PENDING status
        try {
          await patientApi.updateAppointment(Number(rescheduleAppt.id), {
            appointment_date: newDate,
            appointment_time: newTime,
            reason: rescheduleReason,
          });
          Alert.alert('Success', 'Appointment updated');
        } catch (updateErr: any) {
          // Fallback to reschedule API if update endpoint doesn't exist or fails
          console.log('Update endpoint not available, using reschedule instead');
          await patientApi.rescheduleAppointment(Number(rescheduleAppt.id), {
            new_date: newDate,
            new_time: newTime,
            reason: rescheduleReason,
          });
          setRescheduledAppts(prev => new Set(prev).add(Number(rescheduleAppt.id)));
          Alert.alert('Success', 'Appointment rescheduled');
        }
      } else {
        // Use reschedule API for other statuses
        await patientApi.rescheduleAppointment(Number(rescheduleAppt.id), {
          new_date: newDate,
          new_time: newTime,
          reason: rescheduleReason,
        });
        setRescheduledAppts(prev => new Set(prev).add(Number(rescheduleAppt.id)));
        Alert.alert('Success', 'Appointment rescheduled');
      }
      
      setRescheduleAppt(null);
      setNewDate('');
      setNewTime('');
      setRescheduleReason('');
      setSelectedTimeSlot('');
      const apptRes = await patientApi.getAppointments();
      setAppointments(apptRes.data?.appointments || []);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event?.type === 'dismissed') return;
    let picked = selectedDate;
    if (!picked && event?.nativeEvent?.timestamp) picked = new Date(event.nativeEvent.timestamp);
    if (!picked) return;

    if (isDayAvailable(picked)) {
      const dateStr = picked.toISOString().split('T')[0];
      setNewDate(dateStr);
    } else {
      const avail = normalizeAvailableDays(rescheduleAppt?.available_days).length ? normalizeAvailableDays(rescheduleAppt?.available_days).map(d => d.slice(0,3)).join(', ') : String(rescheduleAppt?.available_days || '');
      if (Platform.OS === 'web') {
        window.alert(`Doctor is not available on this day. Available days: ${avail}`);
      } else {
        Alert.alert('Invalid Date', `Doctor is not available on this day. Available days: ${avail}`);
      }
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
    const raw = rescheduleAppt?.available_days;
    console.log('PatientHomeScreen isDayAvailable - raw available_days:', raw);
    console.log('PatientHomeScreen isDayAvailable - selected date:', date);
    console.log('PatientHomeScreen isDayAvailable - date.getDay():', date.getDay());
    if (!raw) return true;
    const allowed = new Set(normalizeAvailableDays(raw));
    console.log('PatientHomeScreen isDayAvailable - normalized allowed days:', allowed);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    console.log('PatientHomeScreen isDayAvailable - dayName:', dayName);
    console.log('PatientHomeScreen isDayAvailable - is allowed:', allowed.has(dayName));
    return allowed.has(dayName);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      if (rescheduleAppt?.available_from && rescheduleAppt?.available_to) {
        const fromTime = parseInt(String(rescheduleAppt.available_from).replace(':', ''));
        const toTime = parseInt(String(rescheduleAppt.available_to).replace(':', ''));
        const selectedTimeNum = parseInt(timeStr.replace(':', ''));
        
        if (selectedTimeNum < fromTime || selectedTimeNum > toTime) {
          Alert.alert('Invalid Time', `Please select a time between ${rescheduleAppt.available_from} and ${rescheduleAppt.available_to}`);
          return;
        }
      }
      
      setNewTime(timeStr);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: getProfilePhotoUrl(profile?.photo_path) }}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.greeting}>
                Hello, {profile?.full_name || 'Patient'}!
              </Text>
              <Text style={styles.subGreeting}>Find your doctor and book appointment</Text>
            </View>
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

        <Text style={styles.sectionTitle}>Nearby Doctors</Text>
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              name={doctor.full_name || 'Doctor'}
              specialty={doctor.specialty || 'General'}
              rating={doctor.average_rating || 0}
              experience={formatExperience(doctor.experience || '0')}
              fee={`$${doctor.consultation_fee || 0}`}
              avatar={getProfilePhotoUrl(doctor.profile_photo)}
              location={doctor.clinic_address || 'Location not specified'}
              reviews={doctor.total_reviews || 0}
              onPress={() => navigation.navigate('PatientDoctors')}
              showBookButton={true}
              onBookNow={() => handleBookNow(doctor)}
            />
          ))
        ) : (
          <Text style={styles.noResultsText}>
            {searchText.trim() ? 'No doctors found matching your search' : 'No nearby doctors available'}
          </Text>
        )}

        {appointments.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {appointments
              .filter((appt: Record<string, unknown>) => {
                const status = String(appt.status || '').toUpperCase();
                const apptDate = String(appt.appointment_date || '');
                const apptTime = String(appt.appointment_time || '');
                const apptDateTime = new Date(`${apptDate}T${apptTime}`);
                const now = new Date();
                // Show only non-cancelled appointments that are in the future or today
                return status !== 'CANCELLED' && apptDateTime >= now;
              })
              .slice(0, 3)
              .map((appt: Record<string, unknown>, idx: number) => {
              const status = String(appt.status || '').toUpperCase();
              const canCancel = ['PENDING', 'APPROVED'].includes(status);
              const canReschedule = !rescheduledAppts.has(Number(appt.id));
              
              return (
                <TouchableOpacity 
                  key={String(appt.id || idx)} 
                  style={styles.apptCard}
                  onPress={() => setSelectedAppt(appt)}
                  activeOpacity={0.7}
                >
                  <View style={styles.apptCardContent}>
                    <View style={styles.apptInfo}>
                      <Text style={styles.apptDoctor}>{String(appt.doctor_name || 'Doctor')}</Text>
                      <Text style={styles.apptDate}>
                        {String(appt.appointment_date || '')} at {String(appt.appointment_time || '')}
                      </Text>
                      {appt.reason ? (
                        <Text style={styles.apptReason}>Reason: {String(appt.reason)}</Text>
                      ) : null}
                      <StatusBadge status={status} />
                    </View>
                    <View style={styles.apptActions}>
                      {canReschedule ? (
                        <TouchableOpacity
                          style={styles.rescheduleButton}
                          onPress={() => setRescheduleAppt(appt)}
                        >
                          <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                        </TouchableOpacity>
                      ) : null}
                      {canCancel ? (
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => handleCancelAppointment(Number(appt.id))}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={!!selectedAppt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Appointment Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Doctor:</Text>
                <Text style={styles.detailValue}>Dr. {String(selectedAppt?.doctor_name || '')}</Text>
              </View>
              {!!selectedAppt?.specialty && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Specialty:</Text>
                  <Text style={styles.detailValue}>{String(selectedAppt.specialty)}</Text>
                </View>
              )}
              {!!selectedAppt?.clinic_name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Clinic:</Text>
                  <Text style={styles.detailValue}>{String(selectedAppt.clinic_name)}</Text>
                </View>
              )}
              {!!selectedAppt?.doctor_mobile && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{String(selectedAppt.doctor_mobile)}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date & Time:</Text>
                <Text style={styles.detailValue}>{String(selectedAppt?.appointment_datetime || `${String(selectedAppt?.appointment_date || '')} at ${String(selectedAppt?.appointment_time || '')}`)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <StatusBadge status={String(selectedAppt?.status || '').toUpperCase()} />
              </View>
              {!!selectedAppt?.reason && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailValue}>{String(selectedAppt.reason)}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booked On:</Text>
                <Text style={styles.detailValue}>{String(selectedAppt?.created_at)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rating Status:</Text>
                <Text style={styles.detailValue}>
                  {selectedAppt?.has_rating ? 'Rated' : 'Not Rated'}
                </Text>
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setSelectedAppt(null)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!rescheduleAppt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <Text style={styles.availabilityText}>Available: {normalizeAvailableDays(rescheduleAppt?.available_days).length ? normalizeAvailableDays(rescheduleAppt?.available_days).map(d => d.slice(0,3)).join(', ') : 'Any day'}</Text>
            {Platform.OS === 'web' ? (
              <>
                <View style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>New Date:</Text>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e: any) => {
                    const val = e.target.value;
                    const parts = val ? val.split('-').map(Number) : [];
                    const selectedDate = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(val);
                    if (isDayAvailable(selectedDate)) {
                      setNewDate(val);
                      setWebDateError('');
                    } else {
                      const avail = normalizeAvailableDays(rescheduleAppt?.available_days).length ? normalizeAvailableDays(rescheduleAppt?.available_days).map(d=>d.slice(0,3)).join(', ') : String(rescheduleAppt?.available_days || '');
                      setWebDateError(`Doctor is not available on this day. Available: ${avail}`);
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  style={styles.webInput}
                  />
                  {webDateError ? <Text style={styles.errorText}>{webDateError}</Text> : null}
                </View>

                {rescheduleAppt?.available_from && rescheduleAppt?.available_to && (
                  <View style={styles.timeSlotContainer}>
                    <Text style={styles.timeSlotLabel}>Available Time Slots:</Text>
                    <View style={styles.timeSlotGrid}>
                      {generateTimeSlots(String(rescheduleAppt.available_from), String(rescheduleAppt.available_to)).map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.timeSlot, selectedTimeSlot === slot && styles.timeSlotSelected]}
                          onPress={() => {
                            setSelectedTimeSlot(slot);
                            setNewTime(formatTimeSlotTo24Hour(slot));
                          }}
                        >
                          <Text style={[styles.timeSlotText, selectedTimeSlot === slot && styles.timeSlotTextSelected]}>{slot}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerButton}>
                  <Text style={styles.pickerLabel}>New Date:</Text>
                  <Text style={styles.pickerValue}>{newDate || 'Select Date'}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={newDate ? new Date(newDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    style={{ width: '100%' }}
                  />
                )}

                {rescheduleAppt?.available_from && rescheduleAppt?.available_to && (
                  <View style={styles.timeSlotContainer}>
                    <Text style={styles.timeSlotLabel}>Available Time Slots:</Text>
                    <View style={styles.timeSlotGrid}>
                      {generateTimeSlots(String(rescheduleAppt.available_from), String(rescheduleAppt.available_to)).map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.timeSlot, selectedTimeSlot === slot && styles.timeSlotSelected]}
                          onPress={() => {
                            setSelectedTimeSlot(slot);
                            setNewTime(formatTimeSlotTo24Hour(slot));
                          }}
                        >
                          <Text style={[styles.timeSlotText, selectedTimeSlot === slot && styles.timeSlotTextSelected]}>{slot}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for rescheduling (optional)"
              placeholderTextColor={colors.textSecondary}
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonOutline]}
                onPress={() => {
                  setRescheduleAppt(null);
                  setNewDate('');
                  setNewTime('');
                  setRescheduleReason('');
                  setSelectedTimeSlot('');
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextOutline]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, actionLoading && styles.modalButtonDisabled]}
                onPress={handleReschedule}
                disabled={actionLoading}
              >
                <Text style={styles.modalButtonText}>{actionLoading ? 'Confirming...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
  },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  noResultsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
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
  apptCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  apptInfo: {
    flex: 1,
  },
  apptDoctor: { fontSize: 16, fontWeight: '600', color: colors.text },
  apptDate: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  apptReason: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  apptActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rescheduleButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  rescheduleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  detailLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, width: 100 },
  detailValue: { fontSize: 14, color: colors.text, flex: 1, textAlign: 'right' },
  modalButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalButton: { flex: 1, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  modalButtonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  modalButtonDisabled: { opacity: 0.6 },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: colors.white },
  modalButtonTextOutline: { color: colors.primary },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  pickerLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  pickerValue: { fontSize: 14, color: colors.primary },
  webInput: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 14, minWidth: 150 },
  reasonInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timeSlotContainer: { marginTop: spacing.md },
  timeSlotLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  timeSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateSlot: { backgroundColor: colors.background, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: '#ddd', marginRight: spacing.sm },
  dateSlotSelected: { backgroundColor: colors.primary },
  dateSlotText: { color: colors.text },
  dateSlotTextSelected: { color: colors.white },
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

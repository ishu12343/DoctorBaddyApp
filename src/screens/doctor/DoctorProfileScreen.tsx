import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { doctorApi } from '../../services/doctorApi';
import { getErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { API_BASE_URL } from '../../config/api';

export default function DoctorProfileScreen() {
  const { logout } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await doctorApi.getProfile();
      const data = res.data || {};
      setPhotoPath(data.profile_photo || null);
      setForm({
        full_name: data.full_name || '',
        email: data.email || '',
        mobile: data.mobile || '',
        gender: data.gender || '',
        specialty: data.specialty || '',
        degree: data.degree || '',
        experience: String(data.experience || ''),
        registration_number: data.registration_number || '',
        clinic_name: data.clinic_name || '',
        clinic_address: data.clinic_address || '',
        city: data.city || '',
        state: data.state || '',
        location: data.location || '',
        council: data.council || '',
        available_from: data.available_from || '',
        available_to: data.available_to || '',
        languages: data.languages || '',
        available_days: data.available_days || '',
      });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickPhoto = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoName(result.assets[0].name);
      
      // Convert file to base64
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setPhotoBase64(base64);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Error converting file to base64:', error);
      }
    }
  };

  const getProfilePhotoUrl = (photo: string | null | undefined): string => {
    if (!photo) {
      return 'https://via.placeholder.com/80';
    }
    // Handle JSON format with base64 data
    try {
      const parsed = JSON.parse(photo);
      if (typeof parsed === 'object' && parsed !== null) {
        const values = Object.values(parsed);
        if (values.length > 0 && typeof values[0] === 'string' && values[0].startsWith('data:')) {
          console.log('DoctorProfileScreen: Extracted base64 photo from JSON');
          return values[0];
        }
      }
    } catch (e) {
      // Not JSON, check for custom format: {filename=data:image/...}
      if (photo.startsWith('{') && photo.includes('=') && photo.includes('data:')) {
        const match = photo.match(/=([^}]+)/);
        if (match && match[1] && match[1].startsWith('data:')) {
          console.log('DoctorProfileScreen: Extracted base64 photo from custom format');
          return match[1];
        }
      }
      console.log('DoctorProfileScreen: Photo is not JSON format', photo.substring(0, 50));
    }
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    return `${API_BASE_URL}uploads/${photo}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: Record<string, string | object> = { ...form };
      
      // Add photoPath with base64 if photo is selected
      if (photoBase64) {
        updateData.profile_photo = {
          [photoName || 'photo']: photoBase64
        };
      }
      
      await doctorApi.updateProfile(updateData);
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      setPhotoBase64(null);
      setPhotoUri(null);
      setPhotoName('');
      loadProfile();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

 const handleLogout = async () => {
    console.log('DoctorHomeScreen handleLogout called');
    console.log('Calling logout directly');
    await logout();
  };

  if (loading) return <LoadingSpinner />;

  const fields = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'degree', label: 'Qualification' },
    { key: 'experience', label: 'Experience (years)' },
    { key: 'registration_number', label: 'Registration Number' },
    { key: 'council', label: 'Medical Council' },
    { key: 'clinic_name', label: 'Clinic Name' },
    { key: 'clinic_address', label: 'Clinic Address' },
    { key: 'city', label: 'City' },
    { key: 'location', label: 'Location' },
    { key: 'available_from', label: 'Available From' },
    { key: 'available_to', label: 'Available To' },
    { key: 'languages', label: 'Languages' },
    { key: 'available_days', label: 'Available Days' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image
            source={{ uri: getProfilePhotoUrl(photoPath) }}
            style={styles.avatar}
          />
          <Text style={styles.name}>Dr. {form.full_name}</Text>
          <Text style={styles.specialty}>{form.specialty}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Professional Profile</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Ionicons name={editing ? 'close' : 'create-outline'} size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {fields.map((field) =>
            editing ? (
              <AppInput key={field.key} label={field.label} value={form[field.key] || ''} onChangeText={(v) => update(field.key, v)} />
            ) : (
              <View key={field.key} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue}>{form[field.key] || '—'}</Text>
              </View>
            )
          )}

          {editing ? (
            <>
              <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
                <Ionicons name="camera" size={20} color={colors.primary} />
                <Text style={styles.photoText}>{photoName || 'Upload Profile Photo'}</Text>
              </TouchableOpacity>
              <AppButton title="Save Profile" onPress={handleSave} loading={saving} />
            </>
          ) : null}
        </View>

        <AppButton title="Sign Out" variant="danger" onPress={handleLogout} style={styles.logoutBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB' },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  specialty: { fontSize: 14, color: colors.primary, marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  fieldRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  fieldValue: { fontSize: 15, color: colors.text, marginTop: 2 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, borderStyle: 'dashed', marginBottom: spacing.md },
  photoText: { color: colors.primary, fontSize: 14 },
  logoutBtn: { marginTop: spacing.sm },
});

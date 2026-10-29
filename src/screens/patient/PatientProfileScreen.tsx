import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { patientApi } from '../../services/patientApi';
import { getErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { API_BASE_URL } from '../../config/api';

export default function PatientProfileScreen() {
  const { logout } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentBase64, setDocumentBase64] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await patientApi.getProfile();
      const patient = res.data?.patient || {};
      setPhotoPath(patient.photo_path || null);
      setForm({
        full_name: patient.full_name || '',
        email: patient.email || '',
        mobile: patient.mobile || '',
        gender: patient.gender || '',
        dob: patient.dob || patient.date_of_birth || '',
        blood_group: patient.blood_group || '',
        address: patient.address || '',
        city: patient.city || '',
        state: patient.state || '',
        country: patient.country || '',
        emergency_contact: patient.emergency_contact || '',
      });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

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

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (!result.canceled && result.assets[0]) {
      setDocumentUri(result.assets[0].uri);
      setDocumentName(result.assets[0].name);
      
      // Convert file to base64
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setDocumentBase64(base64);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Error converting file to base64:', error);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: Record<string, string | object> = { ...form };
      
      console.log('DEBUG Frontend: Form data:', form);
      console.log('DEBUG Frontend: documentBase64:', documentBase64 ? documentBase64.substring(0, 50) + '...' : 'null');
      console.log('DEBUG Frontend: documentName:', documentName);
      
      // Add documentPath with base64 if file is selected
      if (documentBase64) {
        updateData.documentPath = {
          [documentName || 'document']: documentBase64
        };
        console.log('DEBUG Frontend: documentPath added:', Object.keys(updateData.documentPath));
      }
      
      console.log('DEBUG Frontend: Final updateData:', JSON.stringify(updateData, null, 2));
      
      await patientApi.updateProfile(updateData);
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      setDocumentBase64(null);
      setDocumentUri(null);
      setDocumentName('');
      loadProfile();
    } catch (err) {
      console.error('DEBUG Frontend: Error updating profile:', err);
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

   const handleLogout = async () => {
    console.log('PatientHomeScreen handleLogout called');
    console.log('Calling logout directly');
    await logout();
  };

  if (loading) return <LoadingSpinner />;

  const fields = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gender', label: 'Gender' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'blood_group', label: 'Blood Group' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'emergency_contact', label: 'Emergency Contact' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image
            source={{ uri: getProfilePhotoUrl(photoPath) }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{form.full_name || 'Patient'}</Text>
          <Text style={styles.email}>{form.email}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Information</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Ionicons name={editing ? 'close' : 'create-outline'} size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {fields.map((field) =>
            editing ? (
              <AppInput
                key={field.key}
                label={field.label}
                value={form[field.key] || ''}
                onChangeText={(v) => update(field.key, v)}
              />
            ) : (
              <View key={field.key} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue}>{form[field.key] || '—'}</Text>
              </View>
            )
          )}

          {editing ? (
            <>
              <TouchableOpacity style={styles.docBtn} onPress={pickDocument}>
                <Ionicons name="document-attach" size={20} color={colors.primary} />
                <Text style={styles.docText}>{documentName || 'Attach Document'}</Text>
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
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  fieldRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  fieldValue: { fontSize: 15, color: colors.text, marginTop: 2 },
  docBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, borderStyle: 'dashed', marginBottom: spacing.md },
  docText: { color: colors.primary, fontSize: 14 },
  logoutBtn: { marginTop: spacing.sm },
});

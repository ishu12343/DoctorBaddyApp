import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
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

export default function PatientProfileScreen() {
  const { logout } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const res = await patientApi.getProfile();
      const patient = res.data?.patient || {};
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

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (!result.canceled && result.assets[0]) {
      setDocumentUri(result.assets[0].uri);
      setDocumentName(result.assets[0].name);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value || '');
      });
      if (documentUri) {
        formData.append('document', {
          uri: documentUri,
          name: documentName || 'document',
          type: 'application/octet-stream',
        } as unknown as Blob);
      }
      await patientApi.updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      loadProfile();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
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
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
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

          {editing && (
            <>
              <TouchableOpacity style={styles.docBtn} onPress={pickDocument}>
                <Ionicons name="document-attach" size={20} color={colors.primary} />
                <Text style={styles.docText}>{documentName || 'Attach Document'}</Text>
              </TouchableOpacity>
              <AppButton title="Save Profile" onPress={handleSave} loading={saving} />
            </>
          )}
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
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center' },
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

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doctorApi } from '../../services/doctorApi';
import { getErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function DoctorProfileScreen() {
  const { logout } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await doctorApi.getProfile();
      const data = res.data || {};
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await doctorApi.updateProfile(form);
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
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
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
          <View style={styles.avatar}>
            <Ionicons name="medkit" size={40} color={colors.primary} />
          </View>
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

          {editing && <AppButton title="Save Profile" onPress={handleSave} loading={saving} />}
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
  specialty: { fontSize: 14, color: colors.primary, marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  fieldRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  fieldValue: { fontSize: 15, color: colors.text, marginTop: 2 },
  logoutBtn: { marginTop: spacing.sm },
});

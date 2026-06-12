import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/GradientBackground';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { useAuth, getErrorMessage } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { PublicStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<PublicStackParamList, 'PatientSignUp'>;
};

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientSignUpScreen({ navigation }: Props) {
  const { registerPatient } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
  });

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await registerPatient({
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        address: form.address,
        emergencyContact: form.emergencyContact,
        role: 'PATIENT',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Patient Registration</Text>

            <AppInput label="Full Name" value={form.fullName} onChangeText={(v) => update('fullName', v)} />
            <AppInput label="Email" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
            <AppInput label="Mobile Number" value={form.mobile} onChangeText={(v) => update('mobile', v)} keyboardType="phone-pad" />
            <AppInput label="Password" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />
            <AppInput label="Date of Birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={(v) => update('dateOfBirth', v)} placeholder="1990-01-15" />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.radioRow}>
              {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.radioBtn, form.gender === g && styles.radioActive]}
                  onPress={() => update('gender', g)}
                >
                  <Text style={[styles.radioText, form.gender === g && styles.radioTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Blood Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodScroll}>
              {bloodGroups.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[styles.bloodBtn, form.bloodGroup === bg && styles.bloodActive]}
                  onPress={() => update('bloodGroup', bg)}
                >
                  <Text style={[styles.bloodText, form.bloodGroup === bg && styles.bloodTextActive]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <AppInput label="Address" value={form.address} onChangeText={(v) => update('address', v)} multiline numberOfLines={3} />
            <AppInput label="Emergency Contact" value={form.emergencyContact} onChangeText={(v) => update('emergencyContact', v)} keyboardType="phone-pad" />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton title="Register" onPress={handleSubmit} loading={loading} />
            <TouchableOpacity onPress={() => navigation.navigate('PatientLogin')} style={styles.link}>
              <Text style={styles.linkText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  radioRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  radioBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  radioActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radioText: { fontSize: 13, color: colors.text },
  radioTextActive: { color: colors.white, fontWeight: '600' },
  bloodScroll: { marginBottom: spacing.md },
  bloodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
  bloodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  bloodText: { fontSize: 13, color: colors.text },
  bloodTextActive: { color: colors.white, fontWeight: '600' },
  error: { color: colors.error, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  link: { marginTop: spacing.md, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14, textDecorationLine: 'underline' },
});

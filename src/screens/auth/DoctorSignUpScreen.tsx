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
  navigation: NativeStackNavigationProp<PublicStackParamList, 'DoctorSignUp'>;
};

export default function DoctorSignUpScreen({ navigation }: Props) {
  const { registerDoctor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    registrationNumber: '',
    council: '',
    specialty: '',
    experience: '0',
    degree: '',
    clinicName: '',
    clinicAddress: '',
    location: '',
  });

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await registerDoctor({
        ...form,
        name: form.fullName,
        experience: parseInt(form.experience, 10) || 0,
        approved: false,
        role: 'DOCTOR',
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
            <Text style={styles.title}>Doctor Registration</Text>
            <Text style={styles.note}>Your account requires admin approval before activation.</Text>

            <AppInput label="Full Name" value={form.fullName} onChangeText={(v) => update('fullName', v)} />
            <AppInput label="Email" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
            <AppInput label="Mobile" value={form.mobile} onChangeText={(v) => update('mobile', v)} keyboardType="phone-pad" />
            <AppInput label="Password" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />
            <AppInput label="Registration Number" value={form.registrationNumber} onChangeText={(v) => update('registrationNumber', v)} />
            <AppInput label="Medical Council" value={form.council} onChangeText={(v) => update('council', v)} />
            <AppInput label="Specialty" value={form.specialty} onChangeText={(v) => update('specialty', v)} />
            <AppInput label="Experience (years)" value={form.experience} onChangeText={(v) => update('experience', v)} keyboardType="numeric" />
            <AppInput label="Degree" value={form.degree} onChangeText={(v) => update('degree', v)} />
            <AppInput label="Clinic Name" value={form.clinicName} onChangeText={(v) => update('clinicName', v)} />
            <AppInput label="Clinic Address" value={form.clinicAddress} onChangeText={(v) => update('clinicAddress', v)} multiline />
            <AppInput label="Location/City" value={form.location} onChangeText={(v) => update('location', v)} />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton title="Register" onPress={handleSubmit} loading={loading} />
            <TouchableOpacity onPress={() => navigation.navigate('DoctorLogin')} style={styles.link}>
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
  title: { fontSize: 22, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: spacing.sm },
  note: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  error: { color: colors.error, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  link: { marginTop: spacing.md, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14, textDecorationLine: 'underline' },
});

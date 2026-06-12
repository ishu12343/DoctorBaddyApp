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
  navigation: NativeStackNavigationProp<PublicStackParamList, 'AdminSignUp'>;
};

export default function AdminSignUpScreen({ navigation }: Props) {
  const { registerAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await registerAdmin({ ...form, role: 'ADMIN' });
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
            <Text style={styles.title}>Admin Registration</Text>

            <AppInput label="Full Name" value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} />
            <AppInput label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
            <AppInput label="Password" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton title="Create Account" onPress={handleSubmit} loading={loading} />
            <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')} style={styles.link}>
              <Text style={styles.linkText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: spacing.lg },
  error: { color: colors.error, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  link: { marginTop: spacing.md, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14, textDecorationLine: 'underline' },
});

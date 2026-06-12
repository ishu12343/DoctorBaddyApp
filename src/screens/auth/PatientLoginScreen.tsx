import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/GradientBackground';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { useAuth, getErrorMessage } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { PublicStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<PublicStackParamList, 'PatientLogin'>;
};

export default function PatientLoginScreen({ navigation }: Props) {
  const { loginPatient } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginPatient(email, password);
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
            <Text style={styles.brand}>DoctorBuddy</Text>
            <Text style={styles.title}>Patient Login</Text>

            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AppInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton title="Log In" onPress={handleLogin} loading={loading} />

            <TouchableOpacity onPress={() => navigation.navigate('PatientSignUp')} style={styles.link}>
              <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.link}>
              <Text style={styles.linkText}>Back to Home</Text>
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
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  brand: { fontSize: 24, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: colors.primary, textAlign: 'center', marginBottom: spacing.lg, marginTop: spacing.sm },
  error: { color: colors.error, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  link: { marginTop: spacing.md, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14, textDecorationLine: 'underline' },
});

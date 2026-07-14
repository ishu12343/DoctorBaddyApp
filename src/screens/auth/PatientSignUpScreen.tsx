import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/GradientBackground';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { useAuth, getErrorMessage } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { PublicStackParamList } from '../../navigation/types';
import { otpApi } from '../../services/otpApi';

type Props = {
  navigation: NativeStackNavigationProp<PublicStackParamList, 'PatientSignUp'>;
};

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientSignUpScreen({ navigation }: Props) {
  const { registerPatient } = useAuth();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
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
    // Validate required fields
    if (!form.email || !form.mobile || !form.password || !form.fullName) {
      setError('Please fill in all required fields');
      return;
    }
    
    setError('');
    setOtpLoading(true);
    
    try {
      // Send OTP
      const response = await otpApi.generateOtp(form.email, form.mobile, 'PATIENT');
      if (response.data.success) {
        setShowOtpModal(true);
        setError('');
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp) {
      setError('Please enter OTP');
      return;
    }
    
    setError('');
    setOtpLoading(true);
    
    try {
      // Validate OTP
      const validateResponse = await otpApi.validateOtp(form.email, form.mobile, 'PATIENT', otp);
      if (validateResponse.data.success) {
        // OTP verified, proceed with registration
        setShowOtpModal(false);
        setLoading(true);
        
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
      } else {
        setError(validateResponse.data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setOtpLoading(true);
    try {
      const response = await otpApi.generateOtp(form.email, form.mobile, 'PATIENT');
      if (response.data.success) {
        setError('OTP resent successfully');
      } else {
        setError(response.data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOtpLoading(false);
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
                  style={[styles.radioBtn, form.gender === g ? styles.radioActive : undefined]}
                  onPress={() => update('gender', g)}
                >
                  <Text style={[styles.radioText, form.gender === g ? styles.radioTextActive : undefined]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Blood Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodScroll}>
              {bloodGroups.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[styles.bloodBtn, form.bloodGroup === bg ? styles.bloodActive : undefined]}
                  onPress={() => update('bloodGroup', bg)}
                >
                  <Text style={[styles.bloodText, form.bloodGroup === bg ? styles.bloodTextActive : undefined]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <AppInput label="Address" value={form.address} onChangeText={(v) => update('address', v)} multiline numberOfLines={3} />
            <AppInput label="Emergency Contact" value={form.emergencyContact} onChangeText={(v) => update('emergencyContact', v)} keyboardType="phone-pad" />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton title="Register" onPress={handleSubmit} loading={otpLoading || loading} />
            <TouchableOpacity onPress={() => navigation.navigate('PatientLogin')} style={styles.link}>
              <Text style={styles.linkText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* OTP Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify OTP</Text>
            <Text style={styles.modalText}>Enter the OTP sent to your email and mobile</Text>
            
            <AppInput
              label="OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
            />
            
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            
            <AppButton title="Submit" onPress={handleOtpSubmit} loading={otpLoading || loading} />
            
            <TouchableOpacity onPress={handleResendOtp} style={styles.resendLink}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowOtpModal(false)} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalError: {
    color: colors.error,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  resendLink: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  cancelLink: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

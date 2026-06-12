import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import AppButton from '../../components/AppButton';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { PublicStackParamList } from '../../navigation/types';

const features = [
  { icon: 'medical' as const, title: 'Find Doctors', desc: 'Search by specialty, city, or name' },
  { icon: 'calendar' as const, title: 'Book Appointments', desc: 'Schedule visits with ease' },
  { icon: 'videocam' as const, title: 'Online Consultations', desc: 'Connect with doctors remotely' },
  { icon: 'shield-checkmark' as const, title: 'Secure & Private', desc: 'Your health data is protected' },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const stackNav = navigation.getParent<NativeStackNavigationProp<PublicStackParamList>>();
  const goTo = (screen: keyof PublicStackParamList) => {
    stackNav?.navigate(screen);
  };
  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.brand}>DoctorBuddy</Text>
            <Text style={styles.tagline}>Your health, your way</Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>
              Online doctor visits,{'\n'}
              <Text style={styles.heroHighlight}>made simple</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Connect with qualified healthcare professionals from the comfort of your home.
            </Text>
            <AppButton
              title="Get Started"
              onPress={() => goTo('PatientLogin')}
              style={styles.heroButton}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Doctors</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Why DoctorBuddy?</Text>
          {features.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}

          <View style={styles.loginSection}>
            <Text style={styles.loginTitle}>Login as</Text>
            <View style={styles.loginButtons}>
              <TouchableOpacity
                style={styles.loginCard}
                onPress={() => goTo('PatientLogin')}
              >
                <Ionicons name="person" size={28} color={colors.primary} />
                <Text style={styles.loginCardText}>Patient</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginCard}
                onPress={() => goTo('DoctorLogin')}
              >
                <Ionicons name="medkit" size={28} color={colors.primary} />
                <Text style={styles.loginCardText}>Doctor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginCard}
                onPress={() => goTo('AdminLogin')}
              >
                <Ionicons name="shield" size={28} color={colors.primary} />
                <Text style={styles.loginCardText}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.md },
  brand: { fontSize: 32, fontWeight: '800', color: colors.white },
  tagline: { fontSize: 16, color: colors.white, opacity: 0.9, marginTop: 4 },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.text, lineHeight: 32 },
  heroHighlight: { color: colors.primary },
  heroSubtitle: { fontSize: 15, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 },
  heroButton: { marginTop: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: { fontSize: 20, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  featureDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  loginSection: { marginTop: spacing.lg },
  loginTitle: { fontSize: 18, fontWeight: '600', color: colors.white, textAlign: 'center', marginBottom: spacing.md },
  loginButtons: { flexDirection: 'row', gap: spacing.sm },
  loginCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  loginCardText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});

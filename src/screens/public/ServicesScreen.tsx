import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import AppButton from '../../components/AppButton';
import { colors, spacing, borderRadius } from '../../constants/theme';

const services = [
  {
    icon: 'videocam' as const,
    title: 'Video Consultations',
    description: 'Connect with doctors via secure video calls from anywhere.',
  },
  {
    icon: 'calendar' as const,
    title: 'Appointment Booking',
    description: 'Schedule, reschedule, or cancel appointments with ease.',
  },
  {
    icon: 'document-text' as const,
    title: 'Medical Records',
    description: 'Access and manage your health records securely.',
  },
  {
    icon: 'medical' as const,
    title: 'Doctor Search',
    description: 'Find specialists by specialty, location, or name.',
  },
  {
    icon: 'star' as const,
    title: 'Ratings & Reviews',
    description: 'Rate your experience and help others find great doctors.',
  },
  {
    icon: 'call' as const,
    title: 'Emergency Support',
    description: '24/7 emergency helpline for urgent medical needs.',
  },
];

export default function ServicesScreen() {
  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Our Services</Text>
          <Text style={styles.subtitle}>
            Comprehensive healthcare solutions at your fingertips
          </Text>

          {services.map((service) => (
            <View key={service.title} style={styles.card}>
              <View style={styles.iconContainer}>
                <Ionicons name={service.icon} size={28} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{service.title}</Text>
                <Text style={styles.cardDesc}>{service.description}</Text>
              </View>
            </View>
          ))}

          <View style={styles.emergencyCard}>
            <Ionicons name="alert-circle" size={32} color={colors.error} />
            <Text style={styles.emergencyTitle}>Emergency?</Text>
            <Text style={styles.emergencyDesc}>Call emergency services immediately</Text>
            <AppButton
              title="Call 101"
              variant="danger"
              onPress={() => Linking.openURL('tel:101')}
              style={styles.emergencyButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.white, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.white, opacity: 0.9, textAlign: 'center', marginBottom: spacing.lg, marginTop: spacing.xs },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  emergencyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emergencyTitle: { fontSize: 20, fontWeight: '700', color: colors.error, marginTop: spacing.sm },
  emergencyDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  emergencyButton: { marginTop: spacing.md, width: '100%' },
});

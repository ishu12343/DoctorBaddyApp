import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '../../components/GradientBackground';
import AppButton from '../../components/AppButton';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { PublicStackParamList } from '../../navigation/types';

const services = [
  {
    id: 'patient',
    icon: 'person' as const,
    title: 'Patient Services',
    features: [
      'Book in-clinic & online consultations',
      'Verified doctors directory',
      'Digital health records',
      'Appointment reminders'
    ],
    ctaText: 'Book Appointment',
    gradient: ['#6a11cb', '#2575fc'],
  },
  {
    id: 'doctor',
    icon: 'medkit' as const,
    title: 'Doctor Services',
    features: [
      'Profile management',
      'Appointment scheduling',
      'Video consultations',
      'Earnings dashboard'
    ],
    ctaText: 'Join as Doctor',
    gradient: ['#11998e', '#38ef7d'],
  },
  {
    id: 'common',
    icon: 'shield-checkmark' as const,
    title: 'Common Services',
    features: [
      'Secure payments',
      '24/7 support',
      'Mobile access',
      'Trusted platform'
    ],
    ctaText: 'Learn More',
    gradient: ['#f46b45', '#eea849'],
  },
];

export default function ServicesScreen() {
  const navigation = useNavigation();
  const stackNav = navigation.getParent();

  const handleCTA = (serviceId: string) => {
    if (serviceId === 'patient') {
      stackNav?.navigate('PatientLogin' as keyof PublicStackParamList);
    } else if (serviceId === 'doctor') {
      stackNav?.navigate('DoctorLogin' as keyof PublicStackParamList);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Our Services</Text>
          <Text style={styles.subtitle}>
            Comprehensive healthcare solutions at your fingertips
          </Text>

          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={[styles.iconContainer, { backgroundColor: service.gradient[0] }]}>
                <Ionicons name={service.icon} size={32} color={colors.white} />
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                {service.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => handleCTA(service.id)}
                >
                  <Text style={styles.ctaText}>{service.ctaText}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.emergencyCard}>
            <Ionicons name="call" size={32} color={colors.error} />
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>24/7 Emergency Support</Text>
              <Text style={styles.emergencyDesc}>Immediate assistance when you need it most</Text>
            </View>
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
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  serviceContent: { flex: 1 },
  serviceTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  featureText: { fontSize: 13, color: colors.textSecondary, marginLeft: spacing.xs },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  ctaText: { fontSize: 12, fontWeight: '600', color: colors.white, marginRight: spacing.xs },
  emergencyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emergencyContent: { flex: 1, marginLeft: spacing.md },
  emergencyTitle: { fontSize: 18, fontWeight: '700', color: colors.error },
  emergencyDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  emergencyButton: { marginTop: 0, marginLeft: spacing.md, width: 120 },
});

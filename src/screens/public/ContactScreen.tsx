import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import { colors, spacing, borderRadius } from '../../constants/theme';

const tabs = ['General', 'Technical', 'Billing', 'Emergency'] as const;

const tabContent: Record<typeof tabs[number], { icon: keyof typeof Ionicons.glyphMap; phone: string; email: string; desc: string }> = {
  General: { icon: 'help-circle', phone: '+91 1800-123-4567', email: 'support@doctorbuddy.com', desc: 'General inquiries and support' },
  Technical: { icon: 'construct', phone: '+91 1800-123-4568', email: 'tech@doctorbuddy.com', desc: 'App issues and technical help' },
  Billing: { icon: 'card', phone: '+91 1800-123-4569', email: 'billing@doctorbuddy.com', desc: 'Payment and billing questions' },
  Emergency: { icon: 'alert-circle', phone: '101', email: 'emergency@doctorbuddy.com', desc: 'Medical emergencies - call immediately' },
};

export default function ContactScreen() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('General');
  const content = tabContent[activeTab];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.subtitle}>We're here to help you 24/7</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name={content.icon} size={32} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>{activeTab} Support</Text>
            <Text style={styles.cardDesc}>{content.desc}</Text>

            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${content.phone}`)}>
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text style={styles.contactText}>{content.phone}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${content.email}`)}>
              <Ionicons name="mail" size={20} color={colors.primary} />
              <Text style={styles.contactText}>{content.email}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hoursCard}>
            <Text style={styles.hoursTitle}>Business Hours</Text>
            <Text style={styles.hoursText}>Monday - Friday: 9:00 AM - 6:00 PM</Text>
            <Text style={styles.hoursText}>Saturday: 10:00 AM - 4:00 PM</Text>
            <Text style={styles.hoursText}>Sunday: Closed</Text>
            <Text style={styles.hoursNote}>Emergency support available 24/7</Text>
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
  tabScroll: { marginBottom: spacing.md },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: spacing.sm,
  },
  tabActive: { backgroundColor: colors.white },
  tabText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: colors.primary },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    width: '100%',
    justifyContent: 'center',
  },
  contactText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  hoursCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  hoursTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  hoursText: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  hoursNote: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: spacing.sm },
});

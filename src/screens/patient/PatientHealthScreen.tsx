import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function PatientHealthScreen() {
  const healthServices = [
    { icon: 'videocam-outline', name: 'Video Consultation', color: '#275FD4' },
    { icon: 'flask-outline', name: 'Lab Tests', color: '#16A34A' },
    { icon: 'document-text-outline', name: 'Health Packages', color: '#F59E0B' },
    { icon: 'medkit-outline', name: 'Medicine Delivery', color: '#DC2626' },
    { icon: 'folder-open-outline', name: 'Health Records', color: '#8B5CF6' },
  ];

  const healthTips = [
    { id: 1, title: '10 Tips for a Healthy Heart', category: 'Cardiology', readTime: '5 min read' },
    { id: 2, title: 'Managing Stress in Daily Life', category: 'Mental Health', readTime: '4 min read' },
    { id: 3, title: 'Benefits of Regular Exercise', category: 'Fitness', readTime: '6 min read' },
    { id: 4, title: 'Healthy Eating Habits', category: 'Nutrition', readTime: '5 min read' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Health</Text>

        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.videoConsultBanner}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Video Consultation</Text>
              <Text style={styles.bannerSubtitle}>Connect with doctors from home</Text>
            </View>
            <Ionicons name="videocam" size={50} color="rgba(255,255,255,0.3)" />
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Health Services</Text>
        <View style={styles.servicesGrid}>
          {healthServices.map((service, index) => (
            <TouchableOpacity key={index} style={styles.serviceCard}>
              <View style={[styles.serviceIcon, { backgroundColor: `${service.color}20` }]}>
                <Ionicons name={service.icon} size={24} color={service.color} />
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Health Tips For You</Text>
        {healthTips.map((tip) => (
          <TouchableOpacity key={tip.id} style={styles.tipCard}>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <View style={styles.tipMeta}>
                <Text style={styles.tipCategory}>{tip.category}</Text>
                <Text style={styles.tipReadTime}>{tip.readTime}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  videoConsultBanner: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerText: { flex: 1 },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginRight: '2%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipContent: { flex: 1 },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipCategory: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  tipReadTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  status: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#D97706' },
  APPROVED: { bg: '#D1FAE5', text: '#059669' },
  COMPLETED: { bg: '#DBEAFE', text: '#2563EB' },
  CANCELLED: { bg: '#FEE2E2', text: '#DC2626' },
  REJECTED: { bg: '#FEE2E2', text: '#DC2626' },
  ACTIVE: { bg: '#D1FAE5', text: '#059669' },
  INACTIVE: { bg: '#F3F4F6', text: '#6B7280' },
  SUSPENDED: { bg: '#FEE2E2', text: '#DC2626' },
};

export default function StatusBadge({ status }: Props) {
  const normalized = (status || 'UNKNOWN').toUpperCase();
  const colorScheme = statusColors[normalized] || { bg: '#F3F4F6', text: '#6B7280' };

  return (
    <View style={[styles.badge, { backgroundColor: colorScheme.bg }]}>
      <Text style={[styles.text, { color: colorScheme.text }]}>
        {normalized}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

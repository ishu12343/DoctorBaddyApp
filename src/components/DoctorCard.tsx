import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../constants/theme';
import StarRating from './StarRating';

interface DoctorCardProps {
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  fee: string;
  avatar?: string;
  location?: string;
  reviews?: number;
  onPress?: () => void;
  onBookNow?: () => void;
  showBookButton?: boolean;
}

export default function DoctorCard({ 
  name, 
  specialty, 
  rating, 
  experience, 
  fee, 
  avatar,
  location,
  reviews,
  onPress,
  onBookNow,
  showBookButton = false
}: DoctorCardProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardContent} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.specialty}>{specialty}</Text>
          {location ? (
            <View style={styles.row}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <StarRating rating={rating} size={14} />
            <Text style={styles.ratingText}>({rating}/5)</Text>
            {reviews !== undefined ? (
              <Text style={styles.reviewsText}>({reviews})</Text>
            ) : null}
          </View>
          <View style={styles.row}>
            <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.experience}>{experience}</Text>
          </View>
        </View>
      </TouchableOpacity>
      {showBookButton ? (
        <TouchableOpacity style={styles.bookButton} onPress={onBookNow}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.feeContainer}>
        <Text style={styles.feeText}>Consultation Fee ({fee})</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  cardContent: {
    flexDirection: 'row',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  specialty: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  reviewsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  experience: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  feeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9C27B0',
  },
  feeContainer: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },
  bookButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
});

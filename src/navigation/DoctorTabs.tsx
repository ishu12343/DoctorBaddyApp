import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DoctorTabParamList } from './types';
import { colors } from '../constants/theme';
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import DoctorPatientsScreen from '../screens/doctor/DoctorPatientsScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';

const Tab = createBottomTabNavigator<DoctorTabParamList>();

export default function DoctorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            DoctorHome: focused ? 'home' : 'home-outline',
            DoctorAppointments: focused ? 'calendar' : 'calendar-outline',
            DoctorPatients: focused ? 'people' : 'people-outline',
            DoctorProfile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="DoctorHome" component={DoctorHomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="DoctorAppointments" component={DoctorAppointmentsScreen} options={{ title: 'Appointments' }} />
      <Tab.Screen name="DoctorPatients" component={DoctorPatientsScreen} options={{ title: 'Patients' }} />
      <Tab.Screen name="DoctorProfile" component={DoctorProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PatientTabParamList } from './types';
import { colors } from '../constants/theme';
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import PatientDoctorsScreen from '../screens/patient/PatientDoctorsScreen';
import PatientAppointmentsScreen from '../screens/patient/PatientAppointmentsScreen';
import PatientProfileScreen from '../screens/patient/PatientProfileScreen';

const Tab = createBottomTabNavigator<PatientTabParamList>();

export default function PatientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            PatientHome: focused ? 'home' : 'home-outline',
            PatientDoctors: focused ? 'search' : 'search-outline',
            PatientAppointments: focused ? 'calendar' : 'calendar-outline',
            PatientProfile: focused ? 'person' : 'person-outline',
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
      <Tab.Screen name="PatientHome" component={PatientHomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="PatientDoctors" component={PatientDoctorsScreen} options={{ title: 'Find Doctors' }} />
      <Tab.Screen name="PatientAppointments" component={PatientAppointmentsScreen} options={{ title: 'Appointments' }} />
      <Tab.Screen name="PatientProfile" component={PatientProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

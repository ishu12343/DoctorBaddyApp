import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AdminTabParamList } from './types';
import { colors } from '../constants/theme';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminDoctorsScreen from '../screens/admin/AdminDoctorsScreen';
import AdminPatientsScreen from '../screens/admin/AdminPatientsScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            AdminHome: focused ? 'grid' : 'grid-outline',
            AdminDoctors: focused ? 'medkit' : 'medkit-outline',
            AdminPatients: focused ? 'people' : 'people-outline',
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
      <Tab.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="AdminDoctors" component={AdminDoctorsScreen} options={{ title: 'Doctors' }} />
      <Tab.Screen name="AdminPatients" component={AdminPatientsScreen} options={{ title: 'Patients' }} />
    </Tab.Navigator>
  );
}

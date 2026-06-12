import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PublicStackParamList } from './types';
import { colors } from '../constants/theme';
import HomeScreen from '../screens/public/HomeScreen';
import ServicesScreen from '../screens/public/ServicesScreen';
import ContactScreen from '../screens/public/ContactScreen';
import PatientLoginScreen from '../screens/auth/PatientLoginScreen';
import PatientSignUpScreen from '../screens/auth/PatientSignUpScreen';
import DoctorLoginScreen from '../screens/auth/DoctorLoginScreen';
import DoctorSignUpScreen from '../screens/auth/DoctorSignUpScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import AdminSignUpScreen from '../screens/auth/AdminSignUpScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<PublicStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            HomeTab: focused ? 'home' : 'home-outline',
            ServicesTab: focused ? 'medical' : 'medical-outline',
            ContactTab: focused ? 'call' : 'call-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="ServicesTab" component={ServicesScreen} options={{ title: 'Services' }} />
      <Tab.Screen name="ContactTab" component={ContactScreen} options={{ title: 'Contact' }} />
    </Tab.Navigator>
  );
}

export default function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={MainTabs} />
      <Stack.Screen name="PatientLogin" component={PatientLoginScreen} />
      <Stack.Screen name="PatientSignUp" component={PatientSignUpScreen} />
      <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
      <Stack.Screen name="DoctorSignUp" component={DoctorSignUpScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="AdminSignUp" component={AdminSignUpScreen} />
    </Stack.Navigator>
  );
}

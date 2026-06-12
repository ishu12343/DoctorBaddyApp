import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PublicStack from './PublicStack';
import PatientTabs from './PatientTabs';
import DoctorTabs from './DoctorTabs';
import AdminTabs from './AdminTabs';

export default function RootNavigator() {
  const { token, userType, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  return (
    <NavigationContainer>
      {!token ? (
        <PublicStack />
      ) : userType === 'patient' ? (
        <PatientTabs />
      ) : userType === 'doctor' ? (
        <DoctorTabs />
      ) : userType === 'admin' ? (
        <AdminTabs />
      ) : (
        <PublicStack />
      )}
    </NavigationContainer>
  );
}

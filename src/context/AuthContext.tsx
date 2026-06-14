import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { patientApi } from '../services/patientApi';
import { doctorApi } from '../services/doctorApi';
import { adminApi } from '../services/adminApi';
import { getErrorMessage } from '../services/apiClient';

export type UserType = 'patient' | 'doctor' | 'admin' | null;

interface AuthContextType {
  token: string | null;
  userType: UserType;
  isLoading: boolean;
  loginPatient: (email: string, password: string) => Promise<void>;
  loginDoctor: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  registerPatient: (data: Record<string, unknown>) => Promise<void>;
  registerDoctor: (data: Record<string, unknown>) => Promise<void>;
  registerAdmin: (data: { full_name: string; email: string; password: string; role: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUserType = await AsyncStorage.getItem('userType') as UserType;
      if (storedToken && storedUserType) {
        setToken(storedToken);
        setUserType(storedUserType);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuth = async (newToken: string, type: UserType) => {
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('userType', type || '');
    setToken(newToken);
    setUserType(type);
  };

  const loginPatient = async (email: string, password: string) => {
    const res = await patientApi.login(email, password);
    if (!res.data.token) throw new Error('No authentication token received');
    await saveAuth(res.data.token, 'patient');
  };

  const loginDoctor = async (email: string, password: string) => {
    const res = await doctorApi.login(email, password);
    if (!res.data.token) throw new Error('No authentication token received');
    await saveAuth(res.data.token, 'doctor');
  };

  const loginAdmin = async (email: string, password: string) => {
    const res = await adminApi.login(email, password);
    if (!res.data.token) throw new Error('No authentication token received');
    if (res.data.admin) {
      await AsyncStorage.setItem('admin', JSON.stringify(res.data.admin));
    }
    await saveAuth(res.data.token, 'admin');
  };

  const registerPatient = async (data: Record<string, unknown>) => {
    const res = await patientApi.register(data);
    if (!res.data.token) throw new Error('Registration failed');
    await saveAuth(res.data.token, 'patient');
  };

  const registerDoctor = async (data: Record<string, unknown>) => {
    const res = await doctorApi.register(data);
    if (!res.data.token) throw new Error('Registration failed');
    await saveAuth(res.data.token, 'doctor');
  };

  const registerAdmin = async (data: { full_name: string; email: string; password: string; role: string }) => {
    const res = await adminApi.register(data);
    if (!res.data.token) throw new Error('Registration failed');
    await saveAuth(res.data.token, 'admin');
  };

  const logout = async () => {
    console.log('Logout called for userType:', userType);
    console.log('Current token:', token);
    try {
      if (userType === 'patient') {
        console.log('Calling patient logout API');
        const response = await patientApi.logout();
        console.log('Patient logout API response:', response);
      } else if (userType === 'doctor') {
        console.log('Calling doctor logout API');
        const response = await doctorApi.logout();
        console.log('Doctor logout API response:', response);
      } else if (userType === 'admin') {
        console.log('Skipping admin logout API - endpoint not available on deployed backend');
        // Admin logout endpoint doesn't exist on deployed backend, skip API call
      } else {
        console.log('No matching userType, skipping API call');
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue logout even if API fails
    }
    console.log('Clearing AsyncStorage');
    await Promise.all([
      AsyncStorage.removeItem('token'),
      AsyncStorage.removeItem('userType'),
      AsyncStorage.removeItem('admin'),
    ]);
    console.log('Setting token and userType to null');
    setToken(null);
    setUserType(null);
    console.log('Logout completed');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userType,
        isLoading,
        loginPatient,
        loginDoctor,
        loginAdmin,
        registerPatient,
        registerDoctor,
        registerAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export { getErrorMessage };

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  console.log('apiClient interceptor - URL:', config.url);
  console.log('apiClient interceptor - Token from AsyncStorage:', token ? 'exists' : 'null');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('apiClient interceptor - Authorization header set');
  } else {
    console.log('apiClient interceptor - No token found, skipping Authorization header');
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('apiClient response - URL:', response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('apiClient error - URL:', error.config?.url, 'Error:', error.message);
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    return data?.error || data?.message || error.message || 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
};

export default apiClient;

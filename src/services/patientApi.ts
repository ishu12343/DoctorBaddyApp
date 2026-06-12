import apiClient from './apiClient';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const patientApi = {
  login: (email: string, password: string) =>
    apiClient.post('api/patient/login', { email, password }),

  register: (data: Record<string, unknown>) =>
    apiClient.post('api/patient/register', data),

  logout: () => apiClient.post('api/patient/logout', {}),

  getProfile: () => apiClient.get('api/patient/profile'),

  updateProfile: async (formData: FormData) => {
    const token = await AsyncStorage.getItem('token');
    return apiClient.put('api/patient/updateprofile', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getDoctors: (params?: { specialty?: string; city?: string; search?: string }) =>
    apiClient.get('api/patient/doctors', { params }),

  bookAppointment: (data: {
    doctor_id: number;
    appointment_date: string;
    appointment_time: string;
    reason: string;
  }) => apiClient.post('api/patient/appointments/book', data),

  getAppointments: () => apiClient.get('api/patient/appointments'),

  cancelAppointment: (appointmentId: number) =>
    apiClient.put(`api/patient/appointments/${appointmentId}/cancel`, {}),

  rescheduleAppointment: (
    appointmentId: number,
    data: { new_date: string; new_time: string; reason: string }
  ) => apiClient.post(`api/patient/appointments/${appointmentId}/reschedule`, data),

  rateAppointment: (appointmentId: number, data: { rating: number; review: string }) =>
    apiClient.post(`api/patient/appointments/${appointmentId}/rate`, data),
};

export { API_BASE_URL };

import apiClient from './apiClient';

export const doctorApi = {
  login: (email: string, password: string) =>
    apiClient.post('api/doctor/login', { email, password }),

  register: (data: Record<string, unknown>) =>
    apiClient.post('api/doctor/register', data),

  logout: () => apiClient.post('api/doctor/logout', {}),

  getProfile: () => apiClient.get('api/doctor/profile'),

  updateProfile: (data: Record<string, unknown>) =>
    apiClient.put('api/doctor/profile/update', data),

  getAppointments: () => apiClient.get('api/doctor/appointments'),

  approveAppointment: (appointmentId: number) =>
    apiClient.post(`api/doctor/appointments/${appointmentId}/approve`, {}),

  rejectAppointment: (appointmentId: number) =>
    apiClient.post(`api/doctor/appointments/${appointmentId}/reject`, {}),

  completeAppointment: (appointmentId: number) =>
    apiClient.post(`api/doctor/appointments/${appointmentId}/complete`, {}),

  rescheduleAppointment: (
    appointmentId: number,
    data: { new_date: string; new_time: string; reason: string }
  ) => apiClient.post(`api/doctor/appointments/${appointmentId}/reschedule`, data),

  getAppointmentStats: () => apiClient.get('api/doctor/appointments/stats'),

  getPatients: () => apiClient.get('api/doctor/patients'),

  getRatingsSummary: () => apiClient.get('api/doctor/ratings/summary'),

  getRecentActivities: () => apiClient.get('api/doctor/recent-activities'),
};

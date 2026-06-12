import apiClient from './apiClient';

export const adminApi = {
  login: (email: string, password: string) =>
    apiClient.post('admin/login', { email, password }),

  register: (data: { full_name: string; email: string; password: string; role: string }) =>
    apiClient.post('admin/create', data),

  logout: () => apiClient.post('api/admin/logout', {}),

  getDoctors: () => apiClient.get('admin/doctors'),

  getPatients: () => apiClient.get('admin/patients'),

  viewDoctor: (id: number) => apiClient.get(`admin/doctors/view?id=${id}`),

  viewPatient: (id: number) => apiClient.get(`admin/patient/view?id=${id}`),

  approveDoctor: (id: number) => apiClient.put(`admin/doctors/${id}/approve`, {}),

  rejectDoctor: (id: number) => apiClient.put(`admin/doctors/${id}/reject`, {}),

  suspendDoctor: (id: number) => apiClient.put(`admin/doctors/${id}/suspend`, {}),

  unsuspendDoctor: (id: number) => apiClient.put(`admin/doctors/${id}/unsuspend`, {}),

  activatePatient: (id: number) => apiClient.put(`admin/patients/${id}/activate`, {}),

  deactivatePatient: (id: number) => apiClient.put(`admin/patients/${id}/deactivate`, {}),
};

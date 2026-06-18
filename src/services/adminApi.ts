import apiClient from './apiClient';

export const adminApi = {
  login: (email: string, password: string) =>
    apiClient.post('api/admin/login', { email, password }),

  register: (data: { full_name: string; email: string; password: string; role: string }) =>
    apiClient.post('api/admin/create', data),

  logout: () => apiClient.post('api/admin/logout', {}),

  getDoctors: () => apiClient.get('api/admin/doctors'),

  getPatients: () => apiClient.get('api/admin/patients'),

  viewDoctor: (id: number) => apiClient.get(`api/admin/doctors/view?id=${id}`),

  viewPatient: (id: number) => apiClient.get(`api/admin/patient/view?id=${id}`),

  approveDoctor: (id: number) => apiClient.put(`api/admin/doctors/${id}/approve`, {}),

  rejectDoctor: (id: number) => apiClient.put(`api/admin/doctors/${id}/reject`, {}),

  suspendDoctor: (id: number) => apiClient.put(`api/admin/doctors/${id}/suspend`, {}),

  unsuspendDoctor: (id: number) => apiClient.put(`api/admin/doctors/${id}/unsuspend`, {}),

  activatePatient: (id: number) => apiClient.put(`api/admin/patients/${id}/activate`, {}),

  deactivatePatient: (id: number) => apiClient.put(`api/admin/patients/${id}/deactivate`, {}),
};

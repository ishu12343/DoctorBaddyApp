import apiClient from './apiClient';

export const otpApi = {
  generateOtp: (email: string, mobile: string, userType: 'DOCTOR' | 'PATIENT') =>
    apiClient.post('api/otp/generate', { email, mobile, userType }),

  validateOtp: (email: string, mobile: string, userType: 'DOCTOR' | 'PATIENT', otp: string) =>
    apiClient.post('api/otp/validate', { email, mobile, userType, otp }),
};

import axiosInstance from './axiosInstance';

export const register = (data) =>
  axiosInstance.post('/auth/register', data);

export const login = (data) =>
  axiosInstance.post('/auth/login', data);

export const logout = () =>
  axiosInstance.post('/auth/logout');

export const refreshToken = () =>
  axiosInstance.post('/auth/refresh');

export const sendVerificationCode = (email) =>
  axiosInstance.post('/auth/send-code', { email });

export const verifyCode = (email, code) =>
  axiosInstance.post('/auth/verify-code', { email, code });

export const sendCodeForChange   = ()       => axiosInstance.post('/auth/send-code-change');
export const verifyCodeForChange = (code)   => axiosInstance.post('/auth/verify-code-change', { code });
export const changePassword      = (pw)     => axiosInstance.post('/auth/change-password', { newPassword: pw });
export const changeUsername      = (name)   => axiosInstance.post('/auth/change-username', { newUsername: name });
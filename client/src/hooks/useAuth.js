import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import axiosInstance from '../api/axiosInstance';

const useAuth = () => {
  const { user, accessToken, isLoggedIn, setAuth, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !isLoggedIn) {
      axiosInstance.get('/users/me')
        .then(res => setAuth(res.data, localStorage.getItem('accessToken')))
        .catch(() => {
          localStorage.removeItem('accessToken');
          logout();
        });
    }
  }, []);

  return { user, accessToken, isLoggedIn, setAuth, logout };
};

export default useAuth;
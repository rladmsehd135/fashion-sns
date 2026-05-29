import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user:        null,
  accessToken: null,
  isLoggedIn:  false,

  setAuth:    (user, accessToken) => set({ user, accessToken, isLoggedIn: true }),
  updateUser: (user) => set({ user }),
  logout:     () => set({ user: null, accessToken: null, isLoggedIn: false }),
}));

export default useAuthStore;
import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  unreadCount:   0,
  unreadChat:    0,
  notifications: [],

  addNotification:  (n)         => set(state => ({
    unreadCount:   state.unreadCount + 1,
    notifications: [n, ...state.notifications],
  })),
  setNotifications: (list, cnt) => set({ notifications: list, unreadCount: cnt }),
  setUnreadCount:   (n)         => set({ unreadCount: n }),
  resetUnreadCount: ()          => set({ unreadCount: 0 }),

  setUnreadChat: (n) => set(s => ({
    unreadChat: typeof n === 'function'
      ? Math.min(Math.max(n(s.unreadChat), 0), 99)
      : Math.min(Math.max(n, 0), 99),
  })),
  addUnreadChat:   () => set(s => ({ unreadChat: Math.min(s.unreadChat + 1, 99) })),
  resetUnreadChat: () => set({ unreadChat: 0 }),
}));

export default useNotificationStore;
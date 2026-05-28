import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  notifications:  [],
  unreadCount:    0,
  unreadChat:     0,

  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.is_read).length,
  }),

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount:   state.unreadCount + 1,
  })),

  setUnreadChat: (count) => set({ unreadChat: count }),

  addUnreadChat: () => set((state) => ({ unreadChat: state.unreadChat + 1 })),

  resetUnreadChat: () => set({ unreadChat: 0 }),

  resetUnread: () => set({ unreadCount: 0 }),
}));

export default useNotificationStore;
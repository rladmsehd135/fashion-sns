import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
  unreadCount:    0,
  unreadChat:     0,
  notifications:  [],

  addNotification: (noti) => set(state => ({
    unreadCount:   state.unreadCount + 1,
    notifications: [noti, ...state.notifications],
  })),

 setNotifications: (list, count) => set({ notifications: list, unreadCount: count }),

  setUnreadCount:      (n)  => set({ unreadCount: n }),
  setUnreadChat:       (n)  => set({ unreadChat: n }),
  incrementUnreadChat: ()   => set(state => ({ unreadChat: state.unreadChat + 1 })),
  resetUnreadChat:     ()   => set({ unreadChat: 0 }),
  resetUnreadCount:    ()   => set({ unreadCount: 0 }),
}));

export default useNotificationStore;
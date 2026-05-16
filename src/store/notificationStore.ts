import { create } from 'zustand';

export interface AppNotification {
  id: string;
  text: string;
  time: string;
  unread: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
  role: 'employee' | 'manager' | 'admin';
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'unread'>) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    { id: '1', text: 'Welcome to AtomQuest! Your goal setting window is open.', time: '2h ago', unread: true, type: 'info', role: 'employee' },
    { id: '2', text: 'Aman Sharma submitted goals for your approval.', time: '1h ago', unread: true, type: 'warning', role: 'manager' },
  ],
  addNotification: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      time: 'Just now',
      unread: true,
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications] }));
  },
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, unread: false }))
  })),
  clearAll: () => set({ notifications: [] }),
}));

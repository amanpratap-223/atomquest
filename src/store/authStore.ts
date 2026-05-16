import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import api from '@/lib/api';

// ── Demo fallback users (used when backend is offline) ────────────────────────
const DEMO_USERS: User[] = [
  { id: 'emp1', name: 'Aman Sharma',   email: 'aman@atomberg.com',   role: 'employee', department: 'Sales',           designation: 'Sales Executive',   managerId: 'mgr1' },
  { id: 'emp2', name: 'Priya Mehta',   email: 'priya@atomberg.com',  role: 'employee', department: 'Operations',       designation: 'Ops Analyst',       managerId: 'mgr1' },
  { id: 'emp3', name: 'Rohan Verma',   email: 'rohan@atomberg.com',  role: 'employee', department: 'Sales',           designation: 'Sales Manager',     managerId: 'mgr1' },
  { id: 'emp4', name: 'Sneha Joshi',   email: 'sneha@atomberg.com',  role: 'employee', department: 'Technology',       designation: 'Frontend Engineer', managerId: 'mgr2' },
  { id: 'emp5', name: 'Manas Tiwari',  email: 'manas@atomberg.com',  role: 'employee', department: 'Sales',           designation: 'Business Dev Exec', managerId: 'mgr1' },
  { id: 'emp6', name: 'Arjun Patel',   email: 'arjun@atomberg.com',  role: 'employee', department: 'Customer Success', designation: 'CS Specialist',     managerId: 'mgr2' },
  { id: 'mgr1', name: 'Rahul Kapoor',  email: 'rahul@atomberg.com',  role: 'manager',  department: 'Sales',           designation: 'Sales Head',        managerId: 'adm1' },
  { id: 'mgr2', name: 'Divya Nair',    email: 'divya@atomberg.com',  role: 'manager',  department: 'Technology',       designation: 'Tech Lead',         managerId: 'adm1' },
  { id: 'adm1', name: 'Kavita Rao',    email: 'kavita@atomberg.com', role: 'admin',    department: 'HR',               designation: 'HR Manager' },
];

interface AuthState {
  user: User | null;
  users: User[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  addUser: (newUser: User) => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: DEMO_USERS,   // always start with demo users
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });

        // ── Try real API first ─────────────────────────────────────────────────
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          get().fetchUsers();
          return { success: true };
        } catch (apiErr: any) {
          if (apiErr.response?.status === 401 || apiErr.response?.status === 400) {
            set({ isLoading: false });
            return { success: false, error: apiErr.response.data?.message || 'Invalid credentials.' };
          }
          // Backend offline — fall through to demo mode
        }

        // ── Demo / offline fallback — always check DEMO_USERS directly ─────────
        const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          set({ isLoading: false });
          return { success: false, error: 'No account found with this email.' };
        }
        if (password !== 'demo123') {
          set({ isLoading: false });
          return { success: false, error: 'Incorrect password. Demo password is: demo123' };
        }

        set({
          user: found,
          token: `demo-token-${found.id}`,
          isAuthenticated: true,
          isLoading: false,
          users: DEMO_USERS,  // ensure users list is always populated
        });
        return { success: true };
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      switchRole: (role) => {
        const found = get().users.find(u => u.role === role);
        if (found) set({ user: found, token: `demo-token-${found.id}` });
      },

      addUser: async (newUser) => {
        // Try API, fall back to local
        try {
          const { data } = await api.post('/admin/users', {
            name: newUser.name, email: newUser.email, password: 'demo123',
            role: newUser.role, department: newUser.department,
            designation: newUser.designation, managerId: newUser.managerId,
          });
          set(s => ({ users: [...s.users, data.user] }));
        } catch (_) {
          set(s => ({ users: [...s.users, newUser] }));
        }
      },

      fetchUsers: async () => {
        try {
          const { data } = await api.get('/admin/users');
          if (data.users?.length) set({ users: data.users });
        } catch (_) { /* keep demo users */ }
      },
    }),
    {
      name: 'atomquest-auth-v3',   // v3 clears old empty-users cache
      partialize: (s) => ({
        user: s.user, token: s.token,
        isAuthenticated: s.isAuthenticated, users: s.users,
      }),
    }
  )
);

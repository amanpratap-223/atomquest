import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

// ─── Mock Users ───────────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 'emp1', name: 'Aman Sharma',    email: 'aman@atomberg.com',    role: 'employee', department: 'Sales',       designation: 'Sales Executive',     managerId: 'mgr1' },
  { id: 'emp2', name: 'Priya Mehta',    email: 'priya@atomberg.com',   role: 'employee', department: 'Operations',  designation: 'Ops Analyst',          managerId: 'mgr1' },
  { id: 'emp3', name: 'Rohan Verma',    email: 'rohan@atomberg.com',   role: 'employee', department: 'Sales',       designation: 'Sales Manager',        managerId: 'mgr1' },
  { id: 'emp4', name: 'Sneha Joshi',    email: 'sneha@atomberg.com',   role: 'employee', department: 'Technology',  designation: 'Frontend Engineer',    managerId: 'mgr2' },
  { id: 'mgr1', name: 'Rahul Kapoor',   email: 'rahul@atomberg.com',   role: 'manager',  department: 'Sales',       designation: 'Sales Head',           managerId: 'adm1' },
  { id: 'mgr2', name: 'Divya Nair',     email: 'divya@atomberg.com',   role: 'manager',  department: 'Technology',  designation: 'Tech Lead',            managerId: 'adm1' },
  { id: 'adm1', name: 'Kavita Rao',     email: 'kavita@atomberg.com',  role: 'admin',    department: 'HR',           designation: 'HR Manager',           },
];

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, _password: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (email: string, _password: string) => {
        const found = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!found) return { success: false, error: 'No account found with this email.' };
        set({ user: found, token: 'mock-jwt-token-' + found.id, isAuthenticated: true });
        return { success: true };
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      switchRole: (role: UserRole) => {
        const found = MOCK_USERS.find(u => u.role === role);
        if (found) set({ user: found, token: 'mock-jwt-token-' + found.id });
      },
    }),
    { name: 'atomquest-auth' }
  )
);

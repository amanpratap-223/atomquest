import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import EmployeeDashboard from '@/pages/employee/EmployeeDashboard';
import GoalsPage from '@/pages/employee/GoalsPage';
import CreateGoalPage from '@/pages/employee/CreateGoalPage';
import CheckinsPage from '@/pages/employee/CheckinsPage';
import SharedGoalsPage from '@/pages/manager/SharedGoalsPage';
import AuditTrailPage from '@/pages/admin/AuditTrailPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import AdminEscalationPage from '@/pages/admin/AdminEscalationPage';
import ManagerDashboard from '@/pages/manager/ManagerDashboard';
import ManagerApprovalPage from '@/pages/manager/ManagerApprovalPage';
import ManagerCheckins from '@/pages/manager/ManagerCheckins';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminCyclesPage from '@/pages/admin/AdminCyclesPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';

// ─── Route Guards ─────────────────────────────────────────────────────────────
const PrivateRoute: React.FC<{ children: React.ReactNode; requiredRole?: UserRole | UserRole[] }> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!user || !roles.includes(user.role)) return <Navigate to={`/${user?.role}`} replace />;
  }
  return <>{children}</>;
};

const RoleRedirect: React.FC = () => {
  const { user } = useAuthStore();
  return <Navigate to={`/${user?.role || 'login'}`} replace />;
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#fff',
            color: '#18181b',
            border: '1px solid #e4e4e7',
            borderRadius: '12px',
            fontSize: '13px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login" element={isAuthenticated ? <RoleRedirect /> : <LoginPage />} />

        {/* Root */}
        <Route path="/" element={isAuthenticated ? <RoleRedirect /> : <Navigate to="/login" replace />} />

        {/* Employee Routes */}
        <Route path="/employee" element={<PrivateRoute requiredRole="employee"><EmployeeDashboard /></PrivateRoute>} />
        <Route path="/employee/goals" element={<PrivateRoute requiredRole="employee"><GoalsPage /></PrivateRoute>} />
        <Route path="/employee/goals/create" element={<PrivateRoute requiredRole="employee"><CreateGoalPage /></PrivateRoute>} />
        <Route path="/employee/goals/edit/:id" element={<PrivateRoute requiredRole="employee"><CreateGoalPage /></PrivateRoute>} />
        <Route path="/employee/checkins" element={<PrivateRoute requiredRole="employee"><CheckinsPage /></PrivateRoute>} />

        {/* Manager Routes */}
        <Route path="/manager" element={<PrivateRoute requiredRole="manager"><ManagerDashboard /></PrivateRoute>} />
        <Route path="/manager/team" element={<PrivateRoute requiredRole="manager"><ManagerDashboard /></PrivateRoute>} />
        <Route path="/manager/approvals" element={<PrivateRoute requiredRole="manager"><ManagerApprovalPage /></PrivateRoute>} />
        <Route path="/manager/checkins" element={<PrivateRoute requiredRole="manager"><ManagerCheckins /></PrivateRoute>} />

        <Route path="/manager/shared-goals" element={<PrivateRoute requiredRole="manager"><SharedGoalsPage /></PrivateRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute requiredRole="admin"><AdminUsersPage /></PrivateRoute>} />
        <Route path="/admin/cycles" element={<PrivateRoute requiredRole="admin"><AdminCyclesPage /></PrivateRoute>} />
        <Route path="/admin/reports" element={<PrivateRoute requiredRole="admin"><AdminReportsPage /></PrivateRoute>} />
        <Route path="/admin/analytics" element={<PrivateRoute requiredRole="admin"><AdminAnalyticsPage /></PrivateRoute>} />
        <Route path="/admin/audit" element={<PrivateRoute requiredRole="admin"><AuditTrailPage /></PrivateRoute>} />
        <Route path="/admin/escalation" element={<PrivateRoute requiredRole="admin"><AdminEscalationPage /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

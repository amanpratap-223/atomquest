import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MOCK_USERS } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';
import { Search, UserPlus, Shield } from 'lucide-react';

const AdminUsersPage: React.FC = () => {
  const { goals } = useGoalStore();
  const [search, setSearch] = React.useState('');

  const filtered = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="User Management" subtitle="Manage employees, managers, and roles">
      <div className="flex items-center justify-between mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..." className="input pl-9 w-64"
          />
        </div>
        <button className="btn-primary text-sm"><UserPlus size={15} /> Add User</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              {['User', 'Department', 'Role', 'Manager', 'Goals', 'Status'].map(h => (
                <th key={h} className="table-header text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filtered.map(u => {
              const userGoals = goals.filter(g => g.employeeId === u.id);
              const manager = MOCK_USERS.find(m => m.id === u.managerId);
              const hasApproved = userGoals.some(g => g.status === 'locked');
              return (
                <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-800">{u.name}</p>
                        <p className="text-xs text-zinc-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-zinc-600">{u.department}</td>
                  <td className="table-cell">
                    <Badge variant={u.role === 'admin' ? 'approved' : u.role === 'manager' ? 'submitted' : 'draft'}>
                      {u.role === 'admin' && <Shield size={10} />}
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </Badge>
                  </td>
                  <td className="table-cell text-zinc-500 text-xs">{manager?.name || '—'}</td>
                  <td className="table-cell">
                    <span className="text-sm font-medium">{userGoals.length}</span>
                    <span className="text-xs text-zinc-400"> / 8</span>
                  </td>
                  <td className="table-cell">
                    <Badge variant={hasApproved ? 'approved' : userGoals.length > 0 ? 'submitted' : 'draft'}>
                      {hasApproved ? 'Goals Locked' : userGoals.length > 0 ? 'In Progress' : 'No Goals'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default AdminUsersPage;

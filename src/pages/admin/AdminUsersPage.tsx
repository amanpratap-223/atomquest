import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';
import { Search, UserPlus, Shield, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

type Role = 'employee' | 'manager' | 'admin';

interface NewUser {
  name: string;
  email: string;
  department: string;
  role: Role;
  managerId: string;
  designation: string;
}

const DEPARTMENTS = ['Sales', 'Operations', 'Technology', 'HR', 'Finance', 'Customer Success', 'Quality'];

const AdminUsersPage: React.FC = () => {
  const { goals } = useGoalStore();
  const { addUser, users: globalUsers } = useAuthStore();
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]          = useState<NewUser>({
    name: '', email: '', department: 'Sales', role: 'employee', managerId: '', designation: '',
  });
  const [errors, setErrors] = useState<Partial<NewUser>>({});

  const filtered = globalUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const managers = globalUsers.filter(u => u.role === 'manager' || u.role === 'admin');

  const validate = (): boolean => {
    const e: Partial<NewUser> = {};
    if (!form.name.trim())        e.name        = 'Name is required';
    if (!form.email.trim())       e.email       = 'Email is required';
    if (!form.email.includes('@')) e.email      = 'Enter a valid email';
    if (!form.designation.trim()) e.designation = 'Designation is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddUser = () => {
    if (!validate()) return;

    // Check duplicate email
    if (globalUsers.some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
      setErrors(prev => ({ ...prev, email: 'Email already exists' }));
      return;
    }

    const newUser = {
      id:          `u${Date.now()}`,
      name:        form.name.trim(),
      email:       form.email.trim().toLowerCase(),
      role:        form.role,
      department:  form.department,
      designation: form.designation.trim(),
      managerId:   form.managerId || undefined,
      avatar:      form.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    };

    // Add to global store
    addUser(newUser as any);
    
    setShowModal(false);
    setForm({ name: '', email: '', department: 'Sales', role: 'employee', managerId: '', designation: '' });
    setErrors({});
    toast.success(`✅ ${newUser.name} added successfully!`);
  };

  const handleClose = () => {
    setShowModal(false);
    setForm({ name: '', email: '', department: 'Sales', role: 'employee', managerId: '', designation: '' });
    setErrors({});
  };

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
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
          <UserPlus size={15} /> Add User
        </button>
      </div>

      {/* User Table */}
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
              const manager   = globalUsers.find(m => m.id === u.managerId);
              const hasLocked = userGoals.some(g => g.status === 'locked');
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
                    <Badge variant={hasLocked ? 'locked' : userGoals.length > 0 ? 'submitted' : 'draft'}>
                      {hasLocked ? 'Goals Locked' : userGoals.length > 0 ? 'In Progress' : 'No Goals'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-zinc-400 text-sm">No users found matching "{search}"</div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />

          {/* Modal Card */}
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-violet-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                  <UserPlus size={17} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Add New User</h2>
                  <p className="text-xs text-zinc-500">Create an account for a team member</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
                <X size={16} className="text-zinc-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="col-span-2">
                  <label className="label">Full Name <span className="text-rose-400">*</span></label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Rahul Sharma"
                    className={cn('input', errors.name && 'border-rose-300 focus:ring-rose-200')}
                  />
                  {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <label className="label">Work Email <span className="text-rose-400">*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="e.g., rahul@atomberg.com"
                    className={cn('input', errors.email && 'border-rose-300 focus:ring-rose-200')}
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
                </div>

                {/* Designation */}
                <div className="col-span-2">
                  <label className="label">Designation <span className="text-rose-400">*</span></label>
                  <input
                    value={form.designation}
                    onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
                    placeholder="e.g., Sales Executive"
                    className={cn('input', errors.designation && 'border-rose-300 focus:ring-rose-200')}
                  />
                  {errors.designation && <p className="mt-1 text-xs text-rose-500">{errors.designation}</p>}
                </div>

                {/* Department */}
                <div>
                  <label className="label">Department</label>
                  <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="input">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="label">Role</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))} className="input">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin / HR</option>
                  </select>
                </div>

                {/* Manager (only for employee/manager) */}
                {form.role !== 'admin' && (
                  <div className="col-span-2">
                    <label className="label">Reporting Manager</label>
                    <select value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))} className="input">
                      <option value="">— Select a manager —</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.designation || m.role})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Info note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <strong>Demo note:</strong> User will be added to the session. Default password is <code className="bg-amber-100 px-1 rounded">demo123</code>.
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50">
              <button onClick={handleClose} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAddUser} className="btn-primary text-sm">
                <Check size={15} /> Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminUsersPage;

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Target, CheckSquare, Users, Settings,
  BarChart3, FileText, ShieldCheck, LogOut, ChevronRight,
  Bell, ChevronDown, Repeat2, Share2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils';
import type { UserRole } from '@/types';
import { useNotificationStore } from '@/store/notificationStore';

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_ITEMS: Record<UserRole, { label: string; href: string; icon: React.ElementType }[]> = {
  employee: [
    { label: 'Dashboard',  href: '/employee',         icon: LayoutDashboard },
    { label: 'My Goals',   href: '/employee/goals',   icon: Target },
    { label: 'Check-ins',  href: '/employee/checkins',icon: CheckSquare },
  ],
  manager: [
    { label: 'Dashboard',    href: '/manager',              icon: LayoutDashboard },
    { label: 'My Team',      href: '/manager/team',         icon: Users },
    { label: 'Approvals',    href: '/manager/approvals',    icon: ShieldCheck },
    { label: 'Check-ins',    href: '/manager/checkins',     icon: CheckSquare },
    { label: 'Shared KPI',   href: '/manager/shared-goals', icon: Share2 },
  ],
  admin: [
    { label: 'Dashboard',   href: '/admin',             icon: LayoutDashboard },
    { label: 'Users',       href: '/admin/users',       icon: Users },
    { label: 'Cycles',      href: '/admin/cycles',      icon: Settings },
    { label: 'Reports',     href: '/admin/reports',     icon: FileText },
    { label: 'Analytics',   href: '/admin/analytics',   icon: BarChart3 },
    { label: 'Audit Trail', href: '/admin/audit',       icon: ShieldCheck },
    { label: 'Escalation',  href: '/admin/escalation',  icon: Bell },
  ],
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export const Sidebar: React.FC = () => {
  const { user, logout, switchRole } = useAuthStore();
  const navigate = useNavigate();
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);

  if (!user) return null;
  const navItems = NAV_ITEMS[user.role];

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleOptions: { role: UserRole; label: string; email: string }[] = [
    { role: 'employee', label: 'Employee',   email: 'aman@atomberg.com' },
    { role: 'manager',  label: 'Manager L1', email: 'rahul@atomberg.com' },
    { role: 'admin',    label: 'Admin / HR', email: 'kavita@atomberg.com' },
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r border-zinc-100 flex flex-col z-30 shadow-soft">
      <div className="px-5 py-5 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <p className="font-bold text-zinc-900 text-sm leading-none">AtomQuest</p>
            <p className="text-xs text-zinc-400 mt-0.5">Goal Tracker</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/employee' || item.href === '/manager' || item.href === '/admin'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-violet-50 text-violet-700'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={17} className={isActive ? 'text-violet-600' : 'text-zinc-400'} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto text-violet-400" />}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-3">
          <p className="px-3 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Demo</p>
          <button
            onClick={() => setShowRoleSwitch(s => !s)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-all duration-150"
          >
            <Repeat2 size={17} className="text-zinc-300" />
            Switch Role
            <ChevronDown size={14} className={cn('ml-auto transition-transform', showRoleSwitch && 'rotate-180')} />
          </button>
          {showRoleSwitch && (
            <div className="mt-1 space-y-0.5 animate-slide-up">
              {roleOptions.map(r => (
                <button
                  key={r.role}
                  onClick={() => { switchRole(r.role); setShowRoleSwitch(false); navigate(`/${r.role}`); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all',
                    user.role === r.role
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'text-zinc-500 hover:bg-zinc-50'
                  )}
                >
                  <div className={cn('w-1.5 h-1.5 rounded-full', user.role === r.role ? 'bg-violet-500' : 'bg-zinc-200')} />
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-zinc-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-50 transition-all group">
          <Avatar name={user.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-800 truncate">{user.name}</p>
            <p className="text-xs text-zinc-400 capitalize">{user.role}</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-zinc-100">
            <LogOut size={15} className="text-zinc-400" />
          </button>
        </div>
      </div>
    </aside>
  );
};

// ─── Top Bar ──────────────────────────────────────────────────────────────────
interface TopBarProps { title: string; subtitle?: string; }

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { notifications, markAllRead } = useNotificationStore();
  const [showNotifs, setShowNotifs]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const filteredNotifs = notifications.filter(n => n.role === user?.role || n.role === 'employee');
  const unreadCount = filteredNotifs.filter(n => n.unread).length;

  return (
    <header className="h-16 bg-white border-b border-zinc-100 flex items-center px-6 gap-4 sticky top-0 z-20">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-zinc-900 leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(s => !s); setShowProfile(false); }}
            className="relative p-2 rounded-xl hover:bg-zinc-50 transition-all"
          >
            <Bell size={18} className={unreadCount > 0 ? 'text-violet-600' : 'text-zinc-400'} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-100 z-50 overflow-hidden animate-slide-up">
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-800">Notifications</span>
                <button onClick={markAllRead} className="text-xs text-violet-600 font-medium hover:underline">Mark all read</button>
              </div>
              <div className="divide-y divide-zinc-50 max-h-72 overflow-y-auto">
                {filteredNotifs.length > 0 ? filteredNotifs.map(n => (
                  <div key={n.id} className={cn('flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer', n.unread && 'bg-violet-50/40')}>
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', 
                      n.type === 'error' ? 'bg-rose-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-violet-500')} />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-700 leading-relaxed font-medium">{n.text}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-10 text-center text-zinc-400 text-xs italic">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="relative">
            <button
              onClick={() => { setShowProfile(s => !s); setShowNotifs(false); }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-zinc-50 transition-all"
            >
              <Avatar name={user.name} size="sm" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-zinc-100 z-50 overflow-hidden animate-slide-up">
                <div className="px-4 py-3 border-b border-zinc-100">
                  <p className="text-sm font-semibold text-zinc-800">{user.name}</p>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-medium capitalize">{user.role}</span>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors">
                    <Settings size={14} className="text-zinc-400" /> Account Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {(showNotifs || showProfile) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotifs(false); setShowProfile(false); }} />
      )}
    </header>
  );
};

// ─── App Layout ───────────────────────────────────────────────────────────────
interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title, subtitle }) => (
  <div className="min-h-screen bg-zinc-50">
    <Sidebar />
    <div className="ml-60 min-h-screen flex flex-col">
      <TopBar title={title} subtitle={subtitle} />
      <main className="flex-1 p-6 animate-fade-in">
        {children}
      </main>
    </div>
  </div>
);

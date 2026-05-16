import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { cn } from '@/utils';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, CheckSquare, TrendingUp, ArrowRight, Target } from 'lucide-react';
import type { GoalSheet } from '@/types';

const ManagerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { getTeamGoalSheets, getTeamCheckins } = useGoalStore();

  if (!user) return null;
  const sheets = getTeamGoalSheets(user.id);
  const teamCheckins = getTeamCheckins(user.id, 'Q1');

  const submitted = sheets.filter(s => s.status === 'submitted').length;
  const approved  = sheets.filter(s => s.status === 'approved').length;
  const returned  = sheets.filter(s => s.status === 'returned').length;

  const stats = [
    { label: 'Team Members',      value: sheets.length, icon: Users,       color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Awaiting Approval', value: submitted,      icon: ShieldCheck, color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Goals Approved',    value: approved,       icon: CheckSquare, color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { label: 'Returned for Fix',  value: returned,       icon: TrendingUp,  color: 'text-rose-600',   bg: 'bg-rose-50' },
  ];

  return (
    <AppLayout title="Manager Dashboard" subtitle={`${user.department} · ${user.designation}`}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="stat-card flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', s.bg)}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Team Members */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Team</h2>
            <Link to="/manager/approvals" className="text-xs text-violet-600 font-medium hover:text-violet-800 flex items-center gap-1">
              Review All <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {sheets.map(sheet => (
              <div key={sheet.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100">
                <Avatar name={sheet.employee.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800">{sheet.employee.name}</p>
                  <p className="text-xs text-zinc-400">{sheet.employee.designation}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 max-w-[100px]">
                      <ProgressBar value={sheet.totalWeightage} max={100} size="sm"
                        variant={sheet.totalWeightage === 100 ? 'success' : 'warning'} />
                    </div>
                    <span className="text-xs text-zinc-500">{sheet.goals.length} goals</span>
                  </div>
                </div>
                <Badge variant={
                  sheet.status === 'submitted' ? 'submitted'
                  : sheet.status === 'approved' ? 'locked'
                  : sheet.status === 'returned' ? 'rejected'
                  : 'draft'
                }>
                  {sheet.status.charAt(0).toUpperCase() + sheet.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Q1 Check-in Status */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Q1 Check-in Status</h2>
            <Link to="/manager/checkins" className="text-xs text-violet-600 font-medium hover:text-violet-800 flex items-center gap-1">
              Review <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {teamCheckins.map(({ employee, checkins }) => {
              const memberSheets = sheets.find(s => s.employeeId === employee.id);
              const lockedGoals = memberSheets?.goals.filter(g => g.status === 'locked' || g.status === 'approved') || [];
              const filled = checkins.length;
              const total = lockedGoals.length;
              const avgScore = checkins.length
                ? Math.round(checkins.reduce((s, c) => s + c.progressScore, 0) / checkins.length)
                : 0;

              return (
                <div key={employee.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-all">
                  <Avatar name={employee.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-700">{employee.name}</p>
                    <div className="mt-1">
                      <ProgressBar value={filled} max={Math.max(total, 1)} size="sm"
                        variant={filled === total ? 'success' : 'warning'} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-zinc-700">{filled}/{total} goals</p>
                    {avgScore > 0 && (
                      <p className={cn('text-xs font-bold', avgScore >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                        {avgScore}% avg
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {teamCheckins.every(t => t.checkins.length === 0) && (
              <div className="py-6 text-center">
                <Target size={28} className="text-zinc-200 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No Q1 check-ins submitted yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ManagerDashboard;

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { getGreeting, getThrustColor, cn } from '@/utils';
import { ProgressBar } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Target, CheckSquare, TrendingUp, Clock, Plus, ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GoalStatus } from '@/types';

const statusVariant: Record<GoalStatus, 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked'> = {
  draft: 'draft', submitted: 'submitted', approved: 'approved', rejected: 'rejected', locked: 'locked',
};

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { getMyGoals, getMyCheckins } = useGoalStore();

  if (!user) return null;
  const goals = getMyGoals(user.id);
  const q1Checkins = getMyCheckins(user.id, 'Q1');

  const totalWeightage = goals.reduce((s, g) => s + g.weightage, 0);
  const approvedGoals = goals.filter(g => g.status === 'locked' || g.status === 'approved').length;
  const pendingGoals  = goals.filter(g => g.status === 'submitted').length;
  const avgScore = q1Checkins.length
    ? Math.round(q1Checkins.reduce((s, c) => s + c.progressScore, 0) / q1Checkins.length)
    : null;

  const stats = [
    { label: 'Goals Created',    value: goals.length, icon: Target,     color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Weightage Filled', value: `${totalWeightage}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Approval', value: pendingGoals,  icon: Clock,      color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Goals Approved',   value: approvedGoals, icon: CheckSquare,color: 'text-blue-600',   bg: 'bg-blue-50' },
  ];

  return (
    <AppLayout title={`${getGreeting()}, ${user.name.split(' ')[0]} 👋`} subtitle="Here's your goal progress overview">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Goals List */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">My Goals — FY 2025-26</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{goals.length} / 8 goals created</p>
            </div>
            {goals.length < 8 && (
              <Link to="/employee/goals/create" className="btn-primary text-xs py-2 px-3">
                <Plus size={15} /> Add Goal
              </Link>
            )}
          </div>

          {/* Weightage bar */}
          <div className="mb-4 p-3 bg-zinc-50 rounded-xl">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-600">Total Weightage</span>
              <span className={cn('text-xs font-semibold', totalWeightage === 100 ? 'text-emerald-600' : totalWeightage > 100 ? 'text-rose-600' : 'text-amber-600')}>
                {totalWeightage} / 100%
              </span>
            </div>
            <ProgressBar
              value={totalWeightage} max={100}
              variant={totalWeightage === 100 ? 'success' : totalWeightage > 100 ? 'danger' : 'warning'}
              size="md"
            />
          </div>

          {/* Goals */}
          <div className="space-y-2">
            {goals.length === 0 && (
              <div className="py-10 text-center">
                <Target size={32} className="text-zinc-200 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">No goals yet. Create your first goal to get started.</p>
                <Link to="/employee/goals/create" className="btn-primary mt-4 inline-flex text-xs">
                  <Plus size={14} /> Create Goal
                </Link>
              </div>
            )}
            {goals.map(goal => (
              <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('chip text-[10px]', getThrustColor(goal.thrustArea))}>
                      {goal.thrustArea}
                    </span>
                    {goal.isShared && (
                      <span className="chip text-[10px] bg-indigo-50 text-indigo-600">Shared</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-zinc-800 truncate">{goal.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{goal.uomType} · {goal.weightage}% weightage</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={statusVariant[goal.status]}>
                    {goal.status === 'locked' && <Lock size={10} />}
                    {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {goals.length > 0 && (
            <Link to="/employee/goals" className="flex items-center justify-center gap-1.5 mt-4 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors">
              View all goals <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Q1 Progress */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Q1 Check-in Status</h3>
            {q1Checkins.length === 0 ? (
              <div className="text-center py-4">
                <CheckSquare size={28} className="text-zinc-200 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No check-ins logged yet</p>
                <Link to="/employee/checkins" className="text-xs text-violet-600 font-medium mt-2 inline-block hover:text-violet-800">
                  Log Q1 check-in →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {q1Checkins.map(ci => {
                  const goal = goals.find(g => g.id === ci.goalId);
                  return (
                    <div key={ci.id} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-zinc-600 truncate max-w-[140px]">{goal?.title || 'Goal'}</span>
                        <span className={cn('text-xs font-semibold',
                          ci.progressScore >= 80 ? 'text-emerald-600' : ci.progressScore >= 50 ? 'text-amber-600' : 'text-rose-600'
                        )}>{ci.progressScore}%</span>
                      </div>
                      <ProgressBar value={ci.progressScore} size="sm" />
                    </div>
                  );
                })}
                {avgScore !== null && (
                  <div className="pt-2 border-t border-zinc-100 flex justify-between">
                    <span className="text-xs font-semibold text-zinc-600">Avg Progress</span>
                    <span className="text-xs font-bold text-violet-600">{avgScore}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Window */}
          <div className="card p-5 border-l-4 border-l-amber-400">
            <h3 className="section-title mb-2">Active Window</h3>
            <div className="space-y-2">
              {[
                { period: 'Q1 Check-in', date: 'July 2025', active: false },
                { period: 'Q2 Check-in', date: 'October 2025', active: true },
                { period: 'Q3 Check-in', date: 'January 2026', active: false },
                { period: 'Q4 / Annual', date: 'March 2026', active: false },
              ].map(w => (
                <div key={w.period} className={cn('flex items-center justify-between text-xs p-2 rounded-lg',
                  w.active ? 'bg-amber-50 text-amber-800' : 'text-zinc-500'
                )}>
                  <span className="font-medium">{w.period}</span>
                  <span>{w.date}</span>
                  {w.active && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EmployeeDashboard;

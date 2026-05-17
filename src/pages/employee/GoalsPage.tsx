import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { getThrustColor, validateWeightage, cn } from '@/utils';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Lock, Edit3, Send, AlertCircle,
  CheckCircle2, Info, Target, Filter, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Goal, GoalStatus } from '@/types';
import { MAX_GOALS, STATUS_LABELS } from '@/types';

const statusVariant: Record<GoalStatus, any> = {
  draft: 'draft', submitted: 'submitted', approved: 'approved', rejected: 'rejected', locked: 'locked',
};

const GoalsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { getMyGoals, deleteGoal, submitGoals } = useGoalStore();
  const [filter, setFilter] = useState<GoalStatus | 'all'>('all');

  if (!user) return null;
  const allGoals = getMyGoals(user.id);
  const goals = filter === 'all' ? allGoals : allGoals.filter(g => g.status === filter);
  const totalWeightage = allGoals.reduce((s, g) => s + g.weightage, 0);
  const { isValid, remaining } = validateWeightage(allGoals.map(g => g.weightage));

  const draftGoals = allGoals.filter(g => g.status === 'draft');
  const canSubmit = draftGoals.length > 0 && isValid;

  const handleSubmit = () => {
    submitGoals(user.id, 'cy1');
    toast.success('Goals submitted for manager approval!');
  };

  const handleDelete = (goal: Goal) => {
    if (goal.status !== 'draft') { toast.error('Only draft goals can be deleted.'); return; }
    deleteGoal(goal.id);
    toast.success('Goal deleted.');
  };

  return (
    <AppLayout title="My Goals" subtitle="FY 2025-26 · Cycle 1">
      {/* Header actions */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {(['all', 'draft', 'submitted', 'approved', 'locked', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                filter === f ? 'bg-violet-600 text-white shadow-soft' : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300'
              )}
            >
              {f === 'all' ? `All (${allGoals.length})` : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        {allGoals.length < MAX_GOALS && (
          <Link to="/employee/goals/create" className="btn-primary text-sm">
            <Plus size={16} /> Add Goal
          </Link>
        )}
      </div>

      {/* Weightage Summary */}
      <div className={cn('card p-4 mb-5 flex items-center gap-5', totalWeightage === 100 ? 'border-emerald-200' : 'border-amber-200')}>
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-zinc-700">Total Weightage Allocation</span>
            <span className={cn('text-sm font-bold', totalWeightage === 100 ? 'text-emerald-600' : 'text-amber-600')}>
              {totalWeightage} / 100%
            </span>
          </div>
          <ProgressBar value={totalWeightage} max={100} variant={totalWeightage === 100 ? 'success' : totalWeightage > 100 ? 'danger' : 'warning'} size="lg" />
        </div>
        <div className="flex-shrink-0">
          {totalWeightage === 100 ? (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <CheckCircle2 size={18} /> Ready to submit
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-600 text-sm">
              <AlertCircle size={18} /> {remaining > 0 ? `${remaining}% remaining` : 'Over by ' + Math.abs(remaining) + '%'}
            </div>
          )}
        </div>
        {canSubmit && (
          <button onClick={handleSubmit} className="btn-success flex-shrink-0">
            <Send size={15} /> Submit All for Approval
          </button>
        )}
      </div>

      {/* Manager Feedback banner */}
      {(() => {
        const latestComment = allGoals.find(g => g.managerComment)?.managerComment;
        const isRejected = allGoals.some(g => g.status === 'rejected');
        
        if (!latestComment && !isRejected) return null;
        
        return (
          <div className={cn("mb-4 p-3 border rounded-xl flex items-start gap-3", isRejected ? "bg-rose-50 border-rose-200" : "bg-blue-50 border-blue-200")}>
            {isRejected ? (
              <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
            ) : (
              <MessageSquare size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={cn("text-sm font-semibold", isRejected ? "text-rose-700" : "text-blue-700")}>
                {isRejected ? "Goals Returned for Rework" : "Manager Feedback"}
              </p>
              <p className={cn("text-xs mt-0.5", isRejected ? "text-rose-600" : "text-blue-600")}>
                {latestComment ? `"${latestComment}"` : 'Your manager has requested changes. Please review and resubmit.'}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Goals Table */}
      <div className="card overflow-hidden">
        {goals.length === 0 ? (
          <div className="py-16 text-center">
            <Target size={40} className="text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-400">No goals found</p>
            <Link to="/employee/goals/create" className="btn-primary mt-4 inline-flex">
              <Plus size={16} /> Create your first goal
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                {['Thrust Area & Title', 'UoM', 'Target', 'Weightage', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {goals.map(goal => (
                <tr key={goal.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="table-cell max-w-xs">
                    <div className="flex items-start gap-2">
                      {(goal.status === 'locked' || goal.status === 'approved') && (
                        <Lock size={13} className="text-violet-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-zinc-800 text-sm">{goal.title}</p>
                        <span className={cn('chip text-[10px] mt-1', getThrustColor(goal.thrustArea))}>
                          {goal.thrustArea}
                        </span>
                        {goal.isShared && (
                          <span className="chip text-[10px] ml-1 bg-indigo-50 text-indigo-600">Shared</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <Badge variant="info">{goal.uomType}</Badge>
                  </td>
                  <td className="table-cell text-zinc-600">
                    {goal.uomType === 'Timeline' ? String(goal.target).split('T')[0] : String(goal.target)}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16">
                        <ProgressBar value={goal.weightage} max={100} size="sm" variant="primary" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-700">{goal.weightage}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <Badge variant={statusVariant[goal.status]}>
                      {STATUS_LABELS[goal.status]}
                    </Badge>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {goal.status === 'draft' || goal.status === 'rejected' ? (
                        <>
                          <Link to={`/employee/goals/edit/${goal.id}`}
                            className="p-1.5 rounded-lg hover:bg-violet-50 text-zinc-400 hover:text-violet-600 transition-colors">
                            <Edit3 size={14} />
                          </Link>
                          <button onClick={() => handleDelete(goal)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-zinc-300">
                          <Info size={13} /> {goal.status === 'locked' ? 'Locked' : 'Read-only'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1"><Info size={12} /> Max {MAX_GOALS} goals per cycle</span>
        <span className="flex items-center gap-1"><Info size={12} /> Min 10% weightage per goal</span>
        <span className="flex items-center gap-1"><Info size={12} /> Total must equal 100%</span>
      </div>
    </AppLayout>
  );
};

export default GoalsPage;

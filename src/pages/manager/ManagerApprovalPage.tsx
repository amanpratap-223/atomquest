import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { cn, getThrustColor, validateWeightage } from '@/utils';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Edit3, MessageSquare, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { GoalSheet } from '@/types';
import { useNotificationStore } from '@/store/notificationStore';

const ManagerApprovalPage: React.FC = () => {
  const { user } = useAuthStore();
  const { getTeamGoalSheets, approveGoalSheet, rejectGoalSheet, inlineUpdateGoal } = useGoalStore();
  const { addNotification } = useNotificationStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comment, setComment] = useState<Record<string, string>>({});
  const [editTargets, setEditTargets] = useState<Record<string, any>>({});
  const [editWeightages, setEditWeightages] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<'all' | 'submitted' | 'approved' | 'returned'>('all');

  if (!user) return null;
  const sheets = getTeamGoalSheets(user.id);
  const filtered = filter === 'all' ? sheets : sheets.filter(s => s.status === filter);

  const counts = {
    all: sheets.length,
    submitted: sheets.filter(s => s.status === 'submitted').length,
    approved: sheets.filter(s => s.status === 'approved').length,
    returned: sheets.filter(s => s.status === 'returned').length,
  };

  const handleApprove = (sheet: GoalSheet) => {
    // Save any inline edits first
    sheet.goals.forEach(g => {
      const t = editTargets[g.id];
      const w = editWeightages[g.id];
      if (t !== undefined || w !== undefined) {
        inlineUpdateGoal(g.id, t ?? g.target, w ?? g.weightage);
      }
    });
    approveGoalSheet(sheet.employeeId, sheet.cycleId);
    
    // Notify Employee
    addNotification({
      text: `🎉 Your goals for ${sheet.cycleId} have been approved and locked!`,
      type: 'success',
      role: 'employee',
    });

    setExpanded(null);
    toast.success(`Goals approved and locked for ${sheet.employee.name}`);
  };

  const handleReturn = (sheet: GoalSheet) => {
    const c = comment[sheet.employeeId];
    if (!c?.trim()) { toast.error('Please add a comment before returning for rework.'); return; }
    rejectGoalSheet(sheet.employeeId, sheet.cycleId, c);
    
    // Notify Employee
    addNotification({
      text: `⚠️ Your goal sheet was returned for rework. Reason: ${c}`,
      type: 'warning',
      role: 'employee',
    });

    setExpanded(null);
    toast.success(`Returned to ${sheet.employee.name} for rework.`);
  };

  const getSheetWeightages = (sheet: GoalSheet): number[] => {
    return sheet.goals.map(g => editWeightages[g.id] ?? g.weightage);
  };

  return (
    <AppLayout title="Team Goal Approvals" subtitle="Review and approve your team's goal sheets">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {(['all', 'submitted', 'approved', 'returned'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all',
              filter === f ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Users size={36} className="text-zinc-200 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">No submissions yet in this category</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(sheet => {
          const isOpen = expanded === sheet.id;
          const weightages = getSheetWeightages(sheet);
          const { total, isValid } = validateWeightage(weightages);
          const canApprove = sheet.status === 'submitted' && isValid;

          return (
            <div key={sheet.id} className={cn('card overflow-hidden transition-all', isOpen && 'ring-1 ring-violet-200')}>
              {/* Sheet Header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : sheet.id)}
              >
                <Avatar name={sheet.employee.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900">{sheet.employee.name}</p>
                  <p className="text-xs text-zinc-400">{sheet.employee.department} · {sheet.employee.designation}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">{sheet.goals.length} goals</p>
                    <p className={cn('text-xs font-semibold', sheet.totalWeightage === 100 ? 'text-emerald-600' : 'text-amber-600')}>
                      {sheet.totalWeightage}% allocated
                    </p>
                  </div>
                  <div className="w-24">
                    <ProgressBar value={sheet.totalWeightage} max={100}
                      variant={sheet.totalWeightage === 100 ? 'success' : 'warning'} size="sm" />
                  </div>
                  <Badge variant={sheet.status === 'submitted' ? 'submitted' : sheet.status === 'approved' ? 'locked' : sheet.status === 'returned' ? 'rejected' : 'draft'}>
                    {sheet.status.charAt(0).toUpperCase() + sheet.status.slice(1)}
                  </Badge>
                  {isOpen ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
                </div>
              </div>

              {/* Expanded Goal Review Panel */}
              {isOpen && (
                <div className="border-t border-zinc-100 animate-slide-up">
                  <div className="p-4">
                    <table className="w-full mb-4">
                      <thead>
                        <tr className="bg-zinc-50 rounded-xl">
                          {['Goal Title', 'Thrust Area', 'UoM', 'Target', 'Weightage %', 'Formula'].map(h => (
                            <th key={h} className="table-header text-left px-3 py-2.5 first:rounded-l-xl last:rounded-r-xl">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {sheet.goals.map(goal => (
                          <tr key={goal.id} className="group">
                            <td className="table-cell font-medium">{goal.title}</td>
                            <td className="table-cell">
                              <span className={cn('chip text-[10px]', getThrustColor(goal.thrustArea))}>
                                {goal.thrustArea.split(' & ')[0]}
                              </span>
                            </td>
                            <td className="table-cell"><Badge variant="info">{goal.uomType}</Badge></td>
                            <td className="table-cell">
                              {sheet.status === 'submitted' ? (
                                <input
                                  type={goal.uomType === 'Timeline' ? 'date' : 'number'}
                                  defaultValue={goal.uomType === 'Timeline' ? String(goal.target).split('T')[0] : String(goal.target)}
                                  onChange={e => setEditTargets(p => ({
                                    ...p, [goal.id]: goal.uomType === 'Timeline' ? e.target.value : Number(e.target.value)
                                  }))}
                                  className="input py-1.5 text-xs w-28"
                                />
                              ) : (
                                <span className="text-sm">{goal.uomType === 'Timeline' ? String(goal.target).split('T')[0] : goal.target}</span>
                              )}
                            </td>
                            <td className="table-cell">
                              {sheet.status === 'submitted' ? (
                                <input
                                  type="number"
                                  defaultValue={goal.weightage}
                                  min={10} max={100} step={5}
                                  onChange={e => setEditWeightages(p => ({ ...p, [goal.id]: Number(e.target.value) }))}
                                  className="input py-1.5 text-xs w-20"
                                />
                              ) : (
                                <span className="text-sm font-semibold">{goal.weightage}%</span>
                              )}
                            </td>
                            <td className="table-cell text-xs text-zinc-400">
                              {goal.uomType === 'Min' ? 'A ÷ T'
                                : goal.uomType === 'Max' ? 'T ÷ A'
                                : goal.uomType === 'Timeline' ? 'Date check'
                                : 'Zero = 100%'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Weightage validation for inline edits */}
                    {sheet.status === 'submitted' && (
                      <div className="mb-4 flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                        <div className="flex-1">
                          <ProgressBar value={total} max={100}
                            variant={total === 100 ? 'success' : total > 100 ? 'danger' : 'warning'} size="sm" />
                        </div>
                        <span className={cn('text-xs font-semibold', total === 100 ? 'text-emerald-600' : 'text-amber-600')}>
                          {total}% / 100%
                        </span>
                      </div>
                    )}

                    {/* Comment */}
                    {(sheet.status === 'submitted' || sheet.status === 'approved') && (
                      <div className="mb-4">
                        <label className="label flex items-center gap-1.5">
                          <MessageSquare size={14} /> Comment (required for return)
                        </label>
                        <textarea
                          rows={2}
                          value={comment[sheet.employeeId] !== undefined ? comment[sheet.employeeId] : (sheet.goals.find(g => g.managerComment)?.managerComment || '')}
                          onChange={e => setComment(p => ({ ...p, [sheet.employeeId]: e.target.value }))}
                          className="input resize-none"
                          placeholder="Add feedback or reason for return..."
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-2">
                      {sheet.status === 'approved' ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                          <CheckCircle2 size={16} /> Goals approved and locked
                        </div>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center justify-end gap-3">
                        {(sheet.status === 'submitted' || sheet.status === 'approved') && (
                          <button 
                            onClick={() => {
                              const c = comment[sheet.employeeId] !== undefined ? comment[sheet.employeeId] : (sheet.goals.find(g => g.managerComment)?.managerComment || '');
                              if (!c?.trim()) { toast.error('Please enter a comment.'); return; }
                              useGoalStore.getState().updateGoalSheetComment(sheet.employeeId, sheet.cycleId, c);
                              addNotification({
                                text: `💬 Your manager left feedback on your goal sheet: "${c}"`,
                                type: 'info',
                                role: 'employee',
                              });
                              toast.success('Comment saved and notification sent!');
                            }} 
                            className="btn-secondary"
                          >
                            <MessageSquare size={16} className="mr-1 inline" /> Save Comment
                          </button>
                        )}
                        {(sheet.status === 'submitted' || sheet.status === 'approved') && (
                          <button onClick={() => handleReturn(sheet)} className="btn-danger">
                            <XCircle size={16} /> {sheet.status === 'approved' ? 'Unlock & Return' : 'Return for Rework'}
                          </button>
                        )}
                        {sheet.status === 'submitted' && (
                          <button onClick={() => handleApprove(sheet)} disabled={!canApprove} className="btn-success">
                            <CheckCircle2 size={16} /> Approve & Lock Goals
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default ManagerApprovalPage;

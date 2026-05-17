import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Avatar } from '@/components/ui/Avatar';
import { ScoreRing, ProgressBar } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { getThrustColor, cn } from '@/utils';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CheckinPeriod } from '@/types';

const PERIODS: CheckinPeriod[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const ManagerCheckins: React.FC = () => {
  const { user } = useAuthStore();
  const { getTeamCheckins, getTeamGoalSheets, addManagerComment } = useGoalStore();
  const [period, setPeriod] = React.useState<CheckinPeriod>('Q1');
  const [comments, setComments] = React.useState<Record<string, string>>({});

  if (!user) return null;
  const teamCheckins = getTeamCheckins(user.id, period);
  const sheets = getTeamGoalSheets(user.id);

  return (
    <AppLayout title="Team Check-ins" subtitle="Review team achievements and add structured comments">
      {/* Period Tabs */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all border',
              period === p ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
            )}>
            {p} Check-in
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {teamCheckins.map(({ employee, checkins }) => {
          const sheet = sheets.find(s => s.employeeId === employee.id);
          const lockedGoals = sheet?.goals.filter(g => g.status === 'locked' || g.status === 'approved') || [];
          const avgScore = checkins.length ? Math.round(checkins.reduce((s, c) => s + c.progressScore, 0) / checkins.length) : 0;

          return (
            <div key={employee.id} className="card p-5">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100">
                <Avatar name={employee.name} size="md" />
                <div className="flex-1">
                  <p className="font-semibold text-zinc-900">{employee.name}</p>
                  <p className="text-xs text-zinc-400">{employee.department}</p>
                </div>
                {avgScore > 0 && <ScoreRing score={avgScore} size={52} />}
                <Badge variant={checkins.length === lockedGoals.length && checkins.length > 0 ? 'approved' : checkins.length > 0 ? 'submitted' : 'draft'}>
                  {checkins.length}/{lockedGoals.length} checked in
                </Badge>
              </div>

              {lockedGoals.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">No approved goals to check in yet</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {lockedGoals.map(goal => {
                    const ci = checkins.find(c => c.goalId === goal.id);
                    return (
                      <div key={goal.id} className="flex flex-col gap-3 p-3 bg-zinc-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className={cn('chip text-[10px]', getThrustColor(goal.thrustArea))}>
                            {goal.thrustArea.split(' & ')[0]}
                          </span>
                          <span className="text-sm font-medium text-zinc-700 flex-1">{goal.title}</span>
                          <span className="text-xs text-zinc-500">Target: {goal.uomType === 'Timeline' ? String(goal.target).split('T')[0] : goal.target}</span>
                          {ci ? (
                            <>
                              <span className="text-xs font-medium text-zinc-700">Actual: {String(ci.actualAchievement)}</span>
                              <ScoreRing score={ci.progressScore} size={40} strokeWidth={4} />
                            </>
                          ) : (
                            <Badge variant="draft">Not submitted</Badge>
                          )}
                        </div>

                        {ci && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200 mt-1">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-medium text-zinc-500 w-24">Task Status:</label>
                              <select 
                                className="input py-1 text-xs bg-white w-40"
                                value={ci.status}
                                onChange={(e) => {
                                  useGoalStore.getState().updateCheckinStatus(ci.id, e.target.value as any);
                                  toast.success('Task status updated');
                                }}
                              >
                                <option value="not_started">Not Started</option>
                                <option value="on_track">On Track</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                            
                            <div className="flex gap-2 items-start">
                              <label className="text-xs font-medium text-zinc-500 w-24 pt-2">Comment:</label>
                              <textarea 
                                rows={2} 
                                className="input resize-none flex-1 py-1.5 text-xs"
                                value={comments[ci.id] !== undefined ? comments[ci.id] : ci.managerComment || ''}
                                onChange={e => setComments(p => ({ ...p, [ci.id]: e.target.value }))}
                                placeholder="Add feedback for this specific task..." 
                              />
                              <button 
                                onClick={() => {
                                  const val = comments[ci.id] !== undefined ? comments[ci.id] : ci.managerComment || '';
                                  useGoalStore.getState().addManagerComment(ci.id, val);
                                  useNotificationStore.getState().addNotification({
                                    text: `💬 Your manager left feedback on your check-in for "${goal.title}"`,
                                    type: 'info',
                                    role: 'employee',
                                  });
                                  toast.success('Task comment saved and notification sent!');
                                }} 
                                className="btn-primary py-1.5 px-3 text-xs"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default ManagerCheckins;

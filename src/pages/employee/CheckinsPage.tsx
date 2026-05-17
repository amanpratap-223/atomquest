import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { useNotificationStore } from '@/store/notificationStore';
import { ScoreRing, ProgressBar } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { computeProgressScore, getThrustColor, getProgressStatusLabel, cn } from '@/utils';
import type { CheckinPeriod, GoalProgressStatus } from '@/types';
import { Calendar, AlertTriangle, CheckCircle2, Clock, Send, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const PERIODS: { key: CheckinPeriod; label: string; window: string; status: 'past' | 'active' | 'upcoming' }[] = [
  { key: 'Q1', label: 'Q1 Check-in', window: 'July 2025',    status: 'past' },
  { key: 'Q2', label: 'Q2 Check-in', window: 'October 2025', status: 'active' },
  { key: 'Q3', label: 'Q3 Check-in', window: 'January 2026', status: 'upcoming' },
  { key: 'Q4', label: 'Q4 / Annual', window: 'March 2026',   status: 'upcoming' },
];

const STATUS_OPTIONS: { value: GoalProgressStatus; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  { value: 'on_track',    label: 'On Track',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'completed',   label: 'Completed',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

const CheckinsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { getMyGoals, getMyCheckins, submitCheckin } = useGoalStore();
  const [activePeriod, setActivePeriod] = useState<CheckinPeriod>('Q2');
  const [achievements, setAchievements] = useState<Record<string, string | number>>({});
  const [statuses, setStatuses] = useState<Record<string, GoalProgressStatus>>({});
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const lockedGoals = getMyGoals(user.id).filter(g => g.status === 'locked' || g.status === 'approved');
  const existingCheckins = getMyCheckins(user.id, activePeriod);
  const activePeriodMeta = PERIODS.find(p => p.key === activePeriod)!;
  const isWindowOpen = activePeriodMeta.status === 'active';

  const getAchievement = (goalId: string) =>
    achievements[goalId] ?? existingCheckins.find(c => c.goalId === goalId)?.actualAchievement ?? '';

  const getStatus = (goalId: string): GoalProgressStatus =>
    statuses[goalId] ?? existingCheckins.find(c => c.goalId === goalId)?.status ?? 'not_started';

  const getScore = (goal: any) => {
    const ach = getAchievement(goal.id);
    if (ach === '' || ach === undefined) return existingCheckins.find(c => c.goalId === goal.id)?.progressScore || 0;
    return computeProgressScore(goal.uomType, goal.target, ach);
  };

  const { addNotification } = useNotificationStore();

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    
    let hasData = false;
    lockedGoals.forEach(goal => {
      const ach = getAchievement(goal.id);
      if (ach !== '' && ach !== undefined) {
        hasData = true;
        submitCheckin({
          goalId: goal.id, employeeId: user.id, cycleId: 'cy1',
          period: activePeriod,
          actualAchievement: goal.uomType === 'Timeline' ? String(ach) : Number(ach),
          status: getStatus(goal.id),
        });
      }
    });

    if (hasData) {
      // Notify the Manager
      addNotification({
        text: `✅ ${user.name} has submitted ${activePeriod} check-ins for your review.`,
        type: 'success',
        role: 'manager',
      });
      
      toast.success(`${activePeriod} check-in submitted successfully! Manager has been notified.`);
      setAchievements({});
      setStatuses({});
    } else {
      toast.error('Please enter at least one achievement value.');
    }
    
    setSaving(false);
  };

  const filledCount = lockedGoals.filter(g => getAchievement(g.id) !== '').length;

  return (
    <AppLayout title="Quarterly Check-ins" subtitle="Log your actual achievements against planned targets">
      {/* Period Tabs */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => {
              setActivePeriod(p.key);
              setAchievements({});
              setStatuses({});
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
              activePeriod === p.key
                ? 'bg-violet-600 text-white border-violet-600 shadow-soft'
                : p.status === 'active'
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : p.status === 'past'
                    ? 'border-zinc-200 bg-zinc-50 text-zinc-400'
                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
            )}
          >
            {p.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
            {p.status === 'past' && <Lock size={12} />}
            {p.label}
            <span className="text-[10px] font-normal opacity-70">{p.window}</span>
          </button>
        ))}
      </div>

      {/* Window Banner */}
      <div className={cn('p-4 rounded-xl border mb-6 flex items-start gap-3', isWindowOpen ? 'bg-amber-50 border-amber-200' : 'bg-zinc-50 border-zinc-200')}>
        {isWindowOpen ? <Calendar className="text-amber-600 mt-0.5 flex-shrink-0" size={18} /> : <Lock className="text-zinc-400 mt-0.5 flex-shrink-0" size={18} />}
        <div>
          <h3 className={cn('text-sm font-semibold', isWindowOpen ? 'text-amber-800' : 'text-zinc-700')}>
            {isWindowOpen ? `${activePeriodMeta.label} Window is Open` : `${activePeriodMeta.label} Window is Closed`}
          </h3>
          <p className={cn('text-xs mt-0.5', isWindowOpen ? 'text-amber-700' : 'text-zinc-500')}>
            {isWindowOpen
              ? `Window: ${activePeriodMeta.window} · Log your actual achievements below`
              : 'Data shown below is read-only for historical reference.'}
          </p>
        </div>
        {isWindowOpen && (
          <div className="ml-auto flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg">
            <span>{filledCount}</span><span className="opacity-60">/</span><span>{lockedGoals.length} filled</span>
          </div>
        )}
      </div>

      {/* General Goal Sheet Feedback */}
      {(() => {
        const latestComment = lockedGoals.find(g => g.managerComment)?.managerComment;
        if (!latestComment) return null;
        return (
          <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <ShieldCheck size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-700">General Goal Feedback</p>
              <p className="text-xs mt-0.5 text-blue-600">"{latestComment}"</p>
            </div>
          </div>
        );
      })()}

      {/* No approved goals */}
      {lockedGoals.length === 0 && (
        <div className="card p-12 text-center">
          <AlertTriangle size={36} className="text-zinc-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-500">No approved goals yet</p>
          <p className="text-xs text-zinc-400 mt-1">You need manager-approved goals before logging check-ins.</p>
        </div>
      )}

      {/* Goal Check-in Cards */}
      <div className="space-y-4 mb-6">
        {lockedGoals.map(goal => {
          const score = getScore(goal);
          const existing = existingCheckins.find(c => c.goalId === goal.id);
          const isReadonly = !isWindowOpen;
          const ach = getAchievement(goal.id);

          return (
            <div key={goal.id} className="card p-5">
              <div className="flex items-start gap-4">
                {/* Score Ring */}
                <ScoreRing score={score} size={60} />

                {/* Goal Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('chip text-[10px]', getThrustColor(goal.thrustArea))}>
                      {goal.thrustArea}
                    </span>
                    <Badge variant="info">{goal.uomType}</Badge>
                    {goal.isShared && <Badge variant="locked">Shared</Badge>}
                  </div>
                  <p className="font-semibold text-zinc-900">{goal.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Target: <strong>{goal.uomType === 'Timeline' ? String(goal.target).split('T')[0] : goal.target}</strong>
                    {' · '}{goal.weightage}% weightage
                  </p>
                </div>

                {/* Status Selector */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      disabled={isReadonly}
                      onClick={() => setStatuses(prev => ({ ...prev, [goal.id]: s.value }))}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                        getStatus(goal.id) === s.value ? s.color : 'bg-white text-zinc-400 border-zinc-200',
                        isReadonly ? 'opacity-60 cursor-not-allowed' : 'hover:border-zinc-300 cursor-pointer'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Achievement Input */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                <div>
                  <label className="label">Planned Target</label>
                  <div className="input bg-zinc-50 text-zinc-500 cursor-not-allowed">
                    {goal.uomType === 'Timeline' ? String(goal.target).split('T')[0] : goal.target}
                  </div>
                </div>
                <div>
                  <label className="label">Actual Achievement</label>
                  {goal.uomType === 'Timeline' ? (
                    <input
                      type="date"
                      disabled={isReadonly}
                      value={ach === undefined || ach === null ? '' : String(ach)}
                      onChange={e => setAchievements(p => ({ ...p, [goal.id]: e.target.value }))}
                      className={cn('input', isReadonly && 'bg-zinc-50 text-zinc-400 cursor-not-allowed')}
                    />
                  ) : (
                    <input
                      type="number"
                      disabled={isReadonly || goal.isShared}
                      placeholder={goal.isShared ? 'Auto-synced from owner' : 'Enter actual value...'}
                      value={ach === undefined || ach === null ? '' : String(ach)}
                      onChange={e => setAchievements(p => ({ ...p, [goal.id]: e.target.value }))}
                      className={cn('input', (isReadonly || goal.isShared) && 'bg-zinc-50 text-zinc-400 cursor-not-allowed')}
                    />
                  )}
                  {goal.isShared && (
                    <p className="text-[10px] text-indigo-500 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Synced from primary goal owner
                    </p>
                  )}
                </div>
              </div>

              {/* Score Preview */}
              {(ach !== '' && ach !== undefined) && (
                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <ProgressBar value={score} size="sm" className="w-48" />
                    <p className="text-xs text-zinc-400 mt-1.5">
                      Progress Score: <span className={cn('font-semibold', score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600')}>{score}%</span>
                      {goal.uomType !== 'Timeline' && goal.uomType !== 'Zero' && (
                        <span className="text-[10px] text-zinc-400 font-normal ml-1">
                          ({ach || 0} / {goal.target})
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {/* Manager Comment Bubble */}
                  {existing?.managerComment && (
                    <div className="flex-1 ml-6 p-2.5 bg-violet-50 border border-violet-100 rounded-xl relative animate-fade-in">
                      <div className="absolute -left-1.5 top-3 w-3 h-3 bg-violet-50 border-l border-b border-violet-100 rotate-45" />
                      <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <ShieldCheck size={10} /> Manager Feedback
                      </p>
                      <p className="text-xs text-violet-800 italic leading-relaxed">"{existing.managerComment}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {isWindowOpen && lockedGoals.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3">
            {saving ? 'Submitting...' : <><Send size={16} /> Submit {activePeriod} Check-in</>}
          </button>
        </div>
      )}
    </AppLayout>
  );
};

export default CheckinsPage;

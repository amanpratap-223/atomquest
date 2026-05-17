import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Clock, Users, CheckSquare, AlertTriangle, Info, Play, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type TriggerType = 'goal_not_submitted' | 'goal_not_approved' | 'checkin_not_submitted';

interface EscalationRule {
  id: string;
  name: string;
  trigger: TriggerType;
  thresholdDays: number;
  notifyEmployee: boolean;
  notifyManager: boolean;
  notifyAdmin: boolean;
  isActive: boolean;
  lastRunAt?: string;
}

const TRIGGER_META: Record<TriggerType, { label: string; desc: string; icon: React.ElementType; color: string }> = {
  goal_not_submitted:    { label: 'Goals Not Submitted',    desc: 'Employee has not submitted goals before the window closes',  icon: AlertTriangle, color: 'text-amber-500' },
  goal_not_approved:     { label: 'Goals Pending Approval', desc: 'Manager has not approved submitted goals within N days',     icon: Clock,         color: 'text-rose-500' },
  checkin_not_submitted: { label: 'Check-in Not Submitted', desc: 'Employee has not logged check-in during active window',       icon: CheckSquare,   color: 'text-violet-500' },
};

const INITIAL_RULES: EscalationRule[] = [
  { id: 'er1', name: 'Goal Submission Reminder', trigger: 'goal_not_submitted', thresholdDays: 5, notifyEmployee: true, notifyManager: true, notifyAdmin: false, isActive: true, lastRunAt: '2025-05-15T00:00:00Z' },
  { id: 'er2', name: 'Approval Delay Alert',     trigger: 'goal_not_approved',  thresholdDays: 3, notifyEmployee: false, notifyManager: true, notifyAdmin: true,  isActive: true, lastRunAt: '2025-05-15T00:00:00Z' },
  { id: 'er3', name: 'Check-in Reminder',        trigger: 'checkin_not_submitted', thresholdDays: 7, notifyEmployee: true, notifyManager: true, notifyAdmin: false, isActive: false },
];

import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';

const AdminEscalationPage: React.FC = () => {
  const [rules, setRules]         = useState<EscalationRule[]>(INITIAL_RULES);
  const [showForm, setShowForm]   = useState(false);
  const { addNotification }       = useNotificationStore();
  const [form, setForm]           = useState<Partial<EscalationRule>>({
    trigger: 'goal_not_submitted', thresholdDays: 5,
    notifyEmployee: true, notifyManager: true, notifyAdmin: false, isActive: true,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const runManualCheck = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1500));

    const { users } = useAuthStore.getState();
    const { goals } = useGoalStore.getState();

    // 1. Find employees who haven't submitted goals
    const employees = users.filter(u => u.role === 'employee');
    const unsubmittedEmployees = employees.filter(emp => {
      const empGoals = goals.filter(g => g.employeeId === emp.id);
      return empGoals.length === 0 || empGoals.some(g => g.status === 'draft' || g.status === 'rejected');
    });

    // 2. Find managers with pending approvals
    const managers = users.filter(u => u.role === 'manager');
    const managersWithPending = managers.filter(mgr => {
      const teamIds = users.filter(u => u.managerId === mgr.id).map(u => u.id);
      return goals.some(g => teamIds.includes(g.employeeId) && g.status === 'submitted');
    });

    const unsubmittedCount = unsubmittedEmployees.length;
    const pendingManagerCount = managersWithPending.length;

    let totalAlerts = 0;

    // 1. Employee Notification
    if (unsubmittedCount > 0) {
      addNotification({
        text: `🚨 Escalation: You have unsubmitted or rejected goals. The deadline passed 5 days ago. Please submit now.`,
        type: 'error',
        role: 'employee',
      });
      totalAlerts++;
    }

    // 2. Manager Notification
    if (unsubmittedCount > 0 || pendingManagerCount > 0) {
      const pendingText = pendingManagerCount > 0 ? 'You have goals pending your approval.' : '';
      const unsubText = unsubmittedCount > 0 ? `${unsubmittedCount} team members have not submitted goals.` : '';
      addNotification({
        text: `⚠️ Alert: ${unsubText} ${pendingText} Follow-up required.`,
        type: 'warning',
        role: 'manager',
      });
      totalAlerts++;
    }

    // 3. Admin/HR Notification
    addNotification({
      text: `📊 Escalation Scan: ${unsubmittedCount} unsubmitted goal sheets, ${pendingManagerCount} managers with pending approvals. Notifications dispatched.`,
      type: 'success',
      role: 'admin',
    });
    totalAlerts++;

    toast.success(`Escalation check complete! ${totalAlerts} role-based alerts generated using live data.`, {
      icon: '🚀',
      duration: 5000,
    });
    setIsSyncing(false);
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    toast.success('Rule updated');
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Rule deleted');
  };

  const addRule = () => {
    if (!form.name || !form.trigger) { toast.error('Fill in rule name and trigger'); return; }
    const newRule: EscalationRule = {
      id: `er${Date.now()}`, name: form.name!, trigger: form.trigger! as TriggerType,
      thresholdDays: form.thresholdDays || 5, notifyEmployee: form.notifyEmployee ?? true,
      notifyManager: form.notifyManager ?? true, notifyAdmin: form.notifyAdmin ?? false,
      isActive: true,
    };
    setRules(prev => [...prev, newRule]);
    setShowForm(false);
    setForm({ trigger: 'goal_not_submitted', thresholdDays: 5, notifyEmployee: true, notifyManager: true, notifyAdmin: false });
    toast.success('Escalation rule created!');
  };

  return (
    <AppLayout title="Escalation Rules" subtitle="Configure automated notifications for overdue goals, approvals, and check-ins">
      <div className="flex justify-end mb-4">
        <button 
          onClick={runManualCheck}
          disabled={isSyncing}
          className={cn(
            "btn-primary flex items-center gap-2",
            isSyncing && "opacity-80 cursor-wait"
          )}
        >
          {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
          Run Manual Escalation Check
        </button>
      </div>
      {/* Info banner */}
      <div className="mb-5 p-4 bg-violet-50 border border-violet-200 rounded-2xl flex gap-3">
        <Info size={18} className="text-violet-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-violet-700">
          <p className="font-semibold mb-1">How Escalation Works</p>
          <p className="text-violet-600 text-xs leading-relaxed">Rules run daily at midnight (IST) and Monday 9AM. When triggered, they send email and Microsoft Teams notifications to the selected roles. The backend uses <strong>node-cron</strong> for scheduling.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Rules', value: rules.filter(r => r.isActive).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Rules',  value: rules.length,                          color: 'text-violet-600',  bg: 'bg-violet-50' },
          { label: 'Notify Employee', value: rules.filter(r => r.notifyEmployee && r.isActive).length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Notify Manager',  value: rules.filter(r => r.notifyManager  && r.isActive).length, color: 'text-rose-600',   bg: 'bg-rose-50' },
        ].map(s => (
          <div key={s.label} className="stat-card flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.bg)}>
              <Bell size={18} className={s.color} />
            </div>
            <div><p className="text-xl font-bold text-zinc-900">{s.value}</p><p className="text-xs text-zinc-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Rules list */}
      <div className="space-y-4 mb-5">
        {rules.map(rule => {
          const meta = TRIGGER_META[rule.trigger];
          const Icon = meta.icon;
          return (
            <div key={rule.id} className={cn('card p-5 transition-all', !rule.isActive && 'opacity-60')}>
              <div className="flex items-start gap-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  rule.trigger === 'goal_not_submitted' ? 'bg-amber-50' :
                  rule.trigger === 'goal_not_approved'  ? 'bg-rose-50'  : 'bg-violet-50')}>
                  <Icon size={18} className={meta.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-zinc-800 text-sm">{rule.name}</h3>
                    <Badge variant={rule.isActive ? 'approved' : 'draft'}>{rule.isActive ? 'Active' : 'Paused'}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">{meta.desc}</p>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg">
                      <Clock size={11} className="text-zinc-400" />
                      Trigger after <strong>{rule.thresholdDays}d</strong>
                    </span>
                    {rule.notifyEmployee && (
                      <span className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-lg text-violet-700">
                        <Users size={11} /> Notify Employee
                      </span>
                    )}
                    {rule.notifyManager && (
                      <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-700">
                        <Users size={11} /> Notify Manager
                      </span>
                    )}
                    {rule.notifyAdmin && (
                      <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-rose-700">
                        <Users size={11} /> Notify Admin
                      </span>
                    )}
                  </div>

                  {rule.lastRunAt && (
                    <p className="mt-2 text-[10px] text-zinc-400">Last run: {new Date(rule.lastRunAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleRule(rule.id)} className="p-2 rounded-xl hover:bg-zinc-50 transition-colors" title={rule.isActive ? 'Pause' : 'Activate'}>
                    {rule.isActive
                      ? <ToggleRight size={22} className="text-emerald-500" />
                      : <ToggleLeft  size={22} className="text-zinc-300" />}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="p-2 rounded-xl hover:bg-rose-50 transition-colors" title="Delete rule">
                    <Trash2 size={16} className="text-zinc-300 hover:text-rose-500" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Rule Form */}
      {showForm ? (
        <div className="card p-6 border-2 border-violet-200">
          <h3 className="section-title mb-4">New Escalation Rule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Rule Name</label>
              <input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Goal Submission Reminder" className="input" />
            </div>
            <div>
              <label className="label">Trigger</label>
              <select value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value as TriggerType }))} className="input">
                {Object.entries(TRIGGER_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Threshold (days)</label>
              <input type="number" min={1} max={30} value={form.thresholdDays}
                onChange={e => setForm(p => ({ ...p, thresholdDays: Number(e.target.value) }))} className="input" />
            </div>
            <div className="col-span-2 flex gap-6">
              {(['notifyEmployee', 'notifyManager', 'notifyAdmin'] as const).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-violet-600" />
                  <span className="text-sm text-zinc-700">{key === 'notifyEmployee' ? 'Notify Employee' : key === 'notifyManager' ? 'Notify Manager' : 'Notify Admin'}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={addRule} className="btn-primary">Create Rule</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Add Escalation Rule
        </button>
      )}
    </AppLayout>
  );
};

export default AdminEscalationPage;

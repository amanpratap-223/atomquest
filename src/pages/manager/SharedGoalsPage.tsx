import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore, MOCK_USERS } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { getThrustColor, cn } from '@/utils';
import { THRUST_AREAS } from '@/types';
import { Users, Share2, Plus, X, Check, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const SharedGoalsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addGoal } = useGoalStore();
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [form, setForm] = useState({ thrustArea: '', title: '', description: '', target: '', weightage: 15 });
  const [pushed, setPushed] = useState(false);

  if (!user) return null;
  const teamMembers = MOCK_USERS.filter(u => u.managerId === user.id && u.role === 'employee');

  const toggleEmployee = (id: string) =>
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  const handlePush = () => {
    if (!form.title || !form.thrustArea) { toast.error('Fill in the KPI title and thrust area'); return; }
    if (selectedEmployees.length === 0) { toast.error('Select at least one employee'); return; }
    if (form.weightage < 10) { toast.error('Min 10% weightage required'); return; }

    selectedEmployees.forEach(empId => {
      addGoal({
        employeeId: empId, cycleId: 'cy1',
        thrustArea: form.thrustArea, title: form.title,
        description: form.description, uomType: 'Zero',
        target: Number(form.target) || 0, weightage: form.weightage,
        status: 'draft', isShared: true, sharedBy: user.id,
      });
    });
    setPushed(true);
    toast.success(`KPI pushed to ${selectedEmployees.length} employees!`);
    setTimeout(() => { setPushed(false); setForm({ thrustArea: '', title: '', description: '', target: '', weightage: 15 }); setSelectedEmployees([]); }, 2000);
  };

  return (
    <AppLayout title="Push Shared KPI" subtitle="Push a departmental KPI goal to multiple team members">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Form */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title flex items-center gap-2"><Share2 size={16} className="text-violet-500" /> Define Shared KPI</h2>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex gap-2">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>Recipients can only adjust the <strong>weightage</strong>. Goal title and target are read-only once pushed.</span>
          </div>

          <div>
            <label className="label">Thrust Area</label>
            <select value={form.thrustArea} onChange={e => setForm(p => ({ ...p, thrustArea: e.target.value }))} className="input">
              <option value="">Select thrust area...</option>
              {THRUST_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="label">KPI Title <span className="text-zinc-400 text-xs">(read-only for recipients)</span></label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Zero Safety Incidents FY25" className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Describe the shared KPI..." className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target <span className="text-zinc-400 text-xs">(read-only for recipients)</span></label>
              <input type="number" value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))} placeholder="0" className="input" />
            </div>
            <div>
              <label className="label">Default Weightage (%)</label>
              <input type="number" value={form.weightage} min={10} max={50}
                onChange={e => setForm(p => ({ ...p, weightage: Number(e.target.value) }))} className="input" />
              <p className="text-xs text-zinc-400 mt-1">Recipients can adjust this</p>
            </div>
          </div>
        </div>

        {/* Employee Picker */}
        <div className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-4">
            <Users size={16} className="text-violet-500" /> Select Recipients
            {selectedEmployees.length > 0 && (
              <Badge variant="locked">{selectedEmployees.length} selected</Badge>
            )}
          </h2>
          <div className="space-y-2 mb-5">
            {teamMembers.map(emp => {
              const selected = selectedEmployees.includes(emp.id);
              return (
                <div key={emp.id} onClick={() => toggleEmployee(emp.id)}
                  className={cn('flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    selected ? 'border-violet-300 bg-violet-50' : 'border-zinc-200 hover:border-zinc-300 bg-white')}>
                  <Avatar name={emp.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-800">{emp.name}</p>
                    <p className="text-xs text-zinc-400">{emp.department} · {emp.designation}</p>
                  </div>
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    selected ? 'bg-violet-600 border-violet-600' : 'border-zinc-300')}>
                    {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
            {teamMembers.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-6">No team members assigned to you.</p>
            )}
          </div>

          {/* Preview */}
          {selectedEmployees.length > 0 && form.title && (
            <div className="mb-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <p className="text-xs font-semibold text-zinc-600 mb-2">Preview — will be added to:</p>
              <div className="flex flex-wrap gap-1">
                {selectedEmployees.map(id => {
                  const emp = MOCK_USERS.find(u => u.id === id);
                  return <span key={id} className={cn('chip text-[10px]', getThrustColor(form.thrustArea || 'Quality & Compliance'))}>{emp?.name.split(' ')[0]}</span>;
                })}
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                <span className="font-medium text-zinc-700">{form.title}</span>
                {' · '}{form.thrustArea}{' · '}{form.weightage}% weightage
              </div>
            </div>
          )}

          <button onClick={handlePush} disabled={pushed || selectedEmployees.length === 0 || !form.title}
            className={cn('btn-primary w-full justify-center', pushed && 'bg-emerald-500 hover:bg-emerald-600')}>
            {pushed ? <><Check size={16} /> KPI Pushed!</> : <><Share2 size={16} /> Push KPI to {selectedEmployees.length || '...'} Employees</>}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SharedGoalsPage;

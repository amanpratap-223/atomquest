import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Settings, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const CYCLE_WINDOWS = [
  { key: 'goalSetting', label: 'Goal Setting', period: 'Phase 1', open: '2025-05-01', close: '2025-05-31', color: 'bg-violet-50 border-violet-200' },
  { key: 'q1', label: 'Q1 Check-in', period: 'Q1', open: '2025-07-01', close: '2025-07-31', color: 'bg-amber-50 border-amber-200' },
  { key: 'q2', label: 'Q2 Check-in', period: 'Q2', open: '2025-10-01', close: '2025-10-31', color: 'bg-blue-50 border-blue-200' },
  { key: 'q3', label: 'Q3 Check-in', period: 'Q3', open: '2026-01-01', close: '2026-01-31', color: 'bg-emerald-50 border-emerald-200' },
  { key: 'q4', label: 'Q4 / Annual', period: 'Q4', open: '2026-03-01', close: '2026-04-30', color: 'bg-rose-50 border-rose-200' },
];

const AdminCyclesPage: React.FC = () => {
  const [active, setActive] = useState(true);

  return (
    <AppLayout title="Cycle Management" subtitle="Configure and manage the goal setting cycle for FY 2025-26">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">FY 2025-26 · Cycle 1</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Annual performance management cycle</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{active ? 'Active' : 'Inactive'}</span>
                <button onClick={() => { setActive(s => !s); toast.success(active ? 'Cycle deactivated' : 'Cycle activated!'); }}>
                  {active
                    ? <ToggleRight size={32} className="text-emerald-500" />
                    : <ToggleLeft size={32} className="text-zinc-300" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {CYCLE_WINDOWS.map(w => (
                <div key={w.key} className={`p-4 rounded-xl border ${w.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-zinc-500" />
                      <span className="text-sm font-semibold text-zinc-800">{w.label}</span>
                    </div>
                    <span className="text-xs text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200">{w.period}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Window Opens</label>
                      <input type="date" defaultValue={w.open} className="input text-sm py-2" />
                    </div>
                    <div>
                      <label className="label text-xs">Window Closes</label>
                      <input type="date" defaultValue={w.close} className="input text-sm py-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => toast.success('Cycle settings saved!')} className="btn-primary mt-5 w-full justify-center">
              <Settings size={15} /> Save Cycle Configuration
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="section-title mb-3">Cycle Rules</h3>
            <div className="space-y-2.5">
              {[
                'Goal setting opens May 1st annually',
                'Employees have 30 days to submit goals',
                'Manager review window: 15 days post submission',
                'Quarterly check-ins: Q1 Jul, Q2 Oct, Q3 Jan, Q4 Mar/Apr',
                'No check-ins allowed outside the active window',
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                  <span className="w-4 h-4 rounded-full bg-violet-100 text-violet-600 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {r}
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5 bg-amber-50 border-amber-200">
            <p className="text-xs font-semibold text-amber-800 mb-1.5">⚠️ Active Cycle Warning</p>
            <p className="text-xs text-amber-700">Changing window dates while the cycle is active will affect all employees. Communicate changes before saving.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminCyclesPage;

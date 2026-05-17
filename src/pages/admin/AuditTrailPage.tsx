import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils';
import { ShieldCheck, Search, Filter, Download, Clock, User, Target, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_AUDIT_LOGS = [
  { id: 'al1', entityType: 'goal', changedByName: 'Rahul Kapoor', field: 'status', oldValue: 'submitted', newValue: 'locked', timestamp: '2025-05-10T10:00:00Z', action: 'Goal Approved & Locked' },
  { id: 'al2', entityType: 'goal', changedByName: 'Rahul Kapoor', field: 'weightage', oldValue: '20', newValue: '25', timestamp: '2025-05-10T09:45:00Z', action: 'Inline Weightage Edit' },
  { id: 'al3', entityType: 'goal', changedByName: 'Rahul Kapoor', field: 'target', oldValue: '5', newValue: '3', timestamp: '2025-05-10T09:30:00Z', action: 'Inline Target Edit' },
  { id: 'al4', entityType: 'goal', changedByName: 'Rahul Kapoor', field: 'status', oldValue: 'draft', newValue: 'rejected', timestamp: '2025-05-09T11:00:00Z', action: 'Goals Returned for Rework' },
  { id: 'al5', entityType: 'user', changedByName: 'Kavita Rao', field: 'role', oldValue: 'employee', newValue: 'manager', timestamp: '2025-05-08T08:00:00Z', action: 'Role Changed' },
  { id: 'al6', entityType: 'cycle', changedByName: 'Kavita Rao', field: 'Q2Window', oldValue: '2025-09-01', newValue: '2025-10-01', timestamp: '2025-05-07T14:00:00Z', action: 'Cycle Window Updated' },
  { id: 'al7', entityType: 'goal', changedByName: 'Kavita Rao', field: 'status', oldValue: 'locked', newValue: 'draft', timestamp: '2025-05-06T16:00:00Z', action: 'Admin Goal Unlock' },
  { id: 'al8', entityType: 'checkin', changedByName: 'Rahul Kapoor', field: 'managerComment', oldValue: '', newValue: 'Good progress!', timestamp: '2025-07-20T10:00:00Z', action: 'Manager Comment Added' },
];

const ACTION_VARIANTS: Record<string, any> = {
  'Goal Approved & Locked': 'locked', 'Inline Weightage Edit': 'info',
  'Inline Target Edit': 'info', 'Goals Returned for Rework': 'rejected',
  'Role Changed': 'submitted', 'Cycle Window Updated': 'info',
  'Admin Goal Unlock': 'approved', 'Manager Comment Added': 'draft',
};

const ENTITY_COLORS: Record<string, string> = {
  goal: 'bg-violet-50 text-violet-500', user: 'bg-amber-50 text-amber-500',
  cycle: 'bg-blue-50 text-blue-500', checkin: 'bg-emerald-50 text-emerald-500',
};

const AuditTrailPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const filtered = MOCK_AUDIT_LOGS.filter(log =>
    (entityFilter === 'all' || log.entityType === entityFilter) &&
    (!search || log.changedByName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport = () => {
    const csv = ['Timestamp,Changed By,Entity Type,Field,Old Value,New Value,Action',
      ...filtered.map(l => `"${l.timestamp}","${l.changedByName}","${l.entityType}","${l.field}","${l.oldValue}","${l.newValue}","${l.action}"`)
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'audit-trail.csv'; a.click();
    toast.success('Audit log exported!');
  };

  return (
    <AppLayout title="Audit Trail" subtitle="Complete log of all changes after the goal lock date">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or action..." className="input pl-8 text-sm" />
        </div>
        {['all','goal','user','cycle','checkin'].map(f => (
          <button key={f} onClick={() => setEntityFilter(f)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              entityFilter === f ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300')}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={handleExport} className="btn-secondary text-sm"><Download size={14} /> Export</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Events', value: MOCK_AUDIT_LOGS.length, bg: 'bg-violet-50', color: 'text-violet-600' },
          { label: 'Goal Changes', value: MOCK_AUDIT_LOGS.filter(l => l.entityType === 'goal').length, bg: 'bg-amber-50', color: 'text-amber-600' },
          { label: 'Admin Actions', value: MOCK_AUDIT_LOGS.filter(l => l.changedByName === 'Kavita Rao').length, bg: 'bg-rose-50', color: 'text-rose-600' },
          { label: 'This Month', value: MOCK_AUDIT_LOGS.filter(l => l.timestamp.startsWith('2025-05')).length, bg: 'bg-emerald-50', color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="stat-card flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.bg)}>
              <ShieldCheck size={18} className={s.color} />
            </div>
            <div><p className="text-xl font-bold text-zinc-900">{s.value}</p><p className="text-xs text-zinc-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="section-title">Audit Events</span>
          <span className="text-xs text-zinc-400">{filtered.length} events</span>
        </div>
        <div className="divide-y divide-zinc-50">
          {filtered.map(log => (
            <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-zinc-50/50 transition-colors">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', ENTITY_COLORS[log.entityType]?.split(' ')[0])}>
                <ShieldCheck size={16} className={ENTITY_COLORS[log.entityType]?.split(' ')[1]} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={ACTION_VARIANTS[log.action]}>{log.action}</Badge>
                  <span className="text-xs text-zinc-400 capitalize">· {log.entityType}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600 flex-wrap mt-1">
                  <span className="text-zinc-500">Field: <strong className="text-zinc-800">{log.field}</strong></span>
                  {log.oldValue && (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 font-mono font-medium">
                        {log.oldValue}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-zinc-300 flex-shrink-0">
                        <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-medium">
                        {log.newValue}
                      </span>
                    </div>
                  )}
                  {!log.oldValue && log.newValue && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-medium">
                      {log.newValue}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Avatar name={log.changedByName} size="sm" />
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-700">{log.changedByName}</p>
                  <p className="text-[10px] text-zinc-400">{new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default AuditTrailPage;

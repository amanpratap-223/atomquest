import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { MOCK_USERS } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar, ScoreRing } from '@/components/ui/Progress';
import { cn, getThrustColor } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Target, TrendingUp, BarChart3, Download, ShieldCheck, Settings, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#8b5cf6','#22c55e','#f59e0b','#f43f5e','#06b6d4','#ec4899','#10b981','#6366f1'];

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { goals, getTeamGoalSheets } = useGoalStore();

  const allEmployees = MOCK_USERS.filter(u => u.role === 'employee');
  const allManagers  = MOCK_USERS.filter(u => u.role === 'manager');

  const allGoals    = goals;
  const approved    = allGoals.filter(g => g.status === 'locked' || g.status === 'approved').length;
  const submitted   = allGoals.filter(g => g.status === 'submitted').length;

  // Thrust area distribution
  const thrustCounts: Record<string, number> = {};
  allGoals.forEach(g => { thrustCounts[g.thrustArea] = (thrustCounts[g.thrustArea] || 0) + 1; });
  const pieData = Object.entries(thrustCounts).map(([name, value]) => ({ name: name.split(' & ')[0], value }));

  // QoQ trend mock data
  const qoqData = [
    { quarter: 'Q1', Sales: 78, Ops: 65, Tech: 82, HR: 70 },
    { quarter: 'Q2', Sales: 82, Ops: 71, Tech: 88, HR: 74 },
    { quarter: 'Q3', Sales: 86, Ops: 79, Tech: 91, HR: 80 },
    { quarter: 'Q4', Sales: 90, Ops: 85, Tech: 94, HR: 88 },
  ];

  // Manager effectiveness
  const managerData = allManagers.map(mgr => {
    const sheets = getTeamGoalSheets(mgr.id);
    const done = sheets.filter(s => s.status === 'approved').length;
    return { name: mgr.name.split(' ')[0], rate: sheets.length ? Math.round((done / sheets.length) * 100) : 0 };
  });

  const stats = [
    { label: 'Total Employees',  value: allEmployees.length, icon: Users,      color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Total Goals',      value: allGoals.length,     icon: Target,     color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Goals Approved',   value: `${approved}`,       icon: ShieldCheck,color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { label: 'Pending Review',   value: submitted,           icon: TrendingUp, color: 'text-amber-600',  bg: 'bg-amber-50' },
  ];

  const handleExport = () => {
    const csv = ['Employee,Department,Goal Title,Thrust Area,UoM,Target,Weightage,Status',
      ...allGoals.map(g => {
        const emp = MOCK_USERS.find(u => u.id === g.employeeId);
        return `"${emp?.name}","${emp?.department}","${g.title}","${g.thrustArea}","${g.uomType}","${g.target}","${g.weightage}%","${g.status}"`;
      })
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'atomquest-report.csv'; a.click();
    toast.success('Report exported!');
  };

  return (
    <AppLayout title="Admin Dashboard" subtitle="Organization-wide goal tracking overview">
      {/* Quick Nav */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Users',      href: '/admin/users',    icon: Users },
          { label: 'Cycles',     href: '/admin/cycles',   icon: Settings },
          { label: 'Reports',    href: '/admin/reports',  icon: FileText },
          { label: 'Analytics',  href: '/admin/analytics',icon: BarChart3 },
        ].map(item => (
          <Link key={item.href} to={item.href}
            className="card p-4 flex items-center gap-3 hover:shadow-hover hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <item.icon size={18} className="text-violet-600" />
            </div>
            <span className="text-sm font-semibold text-zinc-700">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="stat-card flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', s.bg)}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* QoQ Trend */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Quarter-on-Quarter Achievement Trend</h2>
            <span className="text-xs text-zinc-400">By department</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={qoqData}>
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} domain={[50, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }} />
              <Line type="monotone" dataKey="Sales"  stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} />
              <Line type="monotone" dataKey="Ops"    stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} />
              <Line type="monotone" dataKey="Tech"   stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="HR"     stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: '#f43f5e' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-center">
            {[['Sales','#8b5cf6'],['Ops','#22c55e'],['Tech','#f59e0b'],['HR','#f43f5e']].map(([l,c]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <div className="w-3 h-3 rounded-full" style={{ background: c }} /> {l}
              </div>
            ))}
          </div>
        </div>

        {/* Goal Distribution */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Goal by Thrust Area</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e4e4e7', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-zinc-600">{d.name}</span>
                </div>
                <span className="font-semibold text-zinc-700">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manager Effectiveness + Export */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="section-title mb-4">Manager Effectiveness</h2>
          <div className="space-y-3">
            {managerData.map(m => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-700 w-20">{m.name}</span>
                <div className="flex-1">
                  <ProgressBar value={m.rate} variant={m.rate >= 80 ? 'success' : 'warning'} size="md" />
                </div>
                <span className={cn('text-xs font-bold w-10 text-right', m.rate >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                  {m.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            <button onClick={handleExport}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-600 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all">
              <Download size={17} /> Export Achievement Report (CSV)
            </button>
            <Link to="/admin/audit"
              className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-600 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all">
              <ShieldCheck size={17} /> View Audit Trail
            </Link>
            <Link to="/admin/cycles"
              className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-600 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all">
              <Settings size={17} /> Manage Goal Cycle
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;

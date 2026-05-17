import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useGoalStore } from '@/store/goalStore';
import { useAuthStore } from '@/store/authStore';
import { ProgressBar, ScoreRing } from '@/components/ui/Progress';
import { cn } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { TrendingUp, Users, Target, Award } from 'lucide-react';

const PIE_COLORS = ['#8b5cf6','#22c55e','#f59e0b','#f43f5e','#06b6d4','#ec4899','#10b981'];

const AdminAnalyticsPage: React.FC = () => {
  const { goals, checkins } = useGoalStore();
  const { users } = useAuthStore();
  const employees = users.filter(u => u.role === 'employee');
  const managers  = users.filter(u => u.role === 'manager');

  // QoQ trend
  const qoqData = [
    { quarter: 'Q1', Sales: 78, Operations: 65, Technology: 82, HR: 70 },
    { quarter: 'Q2', Sales: 82, Operations: 71, Technology: 88, HR: 74 },
    { quarter: 'Q3', Sales: 86, Operations: 79, Technology: 91, HR: 80 },
    { quarter: 'Q4', Sales: 90, Operations: 85, Technology: 94, HR: 88 },
  ];

  // Thrust area distribution
  const thrustMap: Record<string, number> = {};
  goals.forEach(g => { thrustMap[g.thrustArea.split(' & ')[0]] = (thrustMap[g.thrustArea.split(' & ')[0]] || 0) + 1; });
  const pieData = Object.entries(thrustMap).map(([name, value]) => ({ name, value }));

  // UoM distribution
  const uomMap: Record<string, number> = {};
  goals.forEach(g => { uomMap[g.uomType] = (uomMap[g.uomType] || 0) + 1; });
  const uomData = Object.entries(uomMap).map(([name, value]) => ({ name, value }));

  // Department heatmap data
  const depts = ['Sales', 'Operations', 'Technology', 'HR'];
  const heatmapData = depts.map(dept => {
    const deptEmps = employees.filter(e => e.department === dept);
    const q1Done = Math.floor(Math.random() * 100);
    const q2Done = Math.floor(Math.random() * 100);
    const q3Done = Math.floor(Math.random() * 60);
    return { dept, Q1: q1Done, Q2: q2Done, Q3: q3Done, Q4: 0 };
  });

  // Manager effectiveness
  const managerData = managers.map(mgr => {
    const team = users.filter(u => u.managerId === mgr.id);
    const approvedSheets = goals.filter(g => team.some(t => t.id === g.employeeId) && (g.status === 'locked' || g.status === 'approved'));
    const rate = team.length ? Math.min(100, Math.round((approvedSheets.length / (team.length * 2)) * 100)) : 0;
    return { name: mgr.name.split(' ')[0], department: mgr.department, rate, team: team.length };
  });

  // Radar data (individual skill areas)
  const radarData = [
    { subject: 'Sales Goals', A: 85, B: 72 },
    { subject: 'Ops Goals', A: 70, B: 80 },
    { subject: 'People Goals', A: 90, B: 65 },
    { subject: 'Finance Goals', A: 75, B: 88 },
    { subject: 'Tech Goals', A: 88, B: 75 },
  ];

  const heatColor = (val: number) =>
    val >= 80 ? '#dcfce7' : val >= 50 ? '#fef3c7' : val > 0 ? '#fee2e2' : '#f4f4f5';
  const heatText  = (val: number) =>
    val >= 80 ? '#15803d' : val >= 50 ? '#92400e' : val > 0 ? '#991b1b' : '#a1a1aa';

  return (
    <AppLayout title="Advanced Analytics" subtitle="Quarter-on-Quarter trends, heatmaps, and org insights">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Avg Q1 Score',     value: `${Math.round(checkins.reduce((s,c)=>s+c.progressScore,0) / Math.max(checkins.length,1))}%`, icon: Award,    color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Goals On Track',   value: `${checkins.filter(c=>c.status==='on_track').length}`,   icon: TrendingUp, color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Goals Completed',  value: `${checkins.filter(c=>c.status==='completed').length}`,  icon: Target,     color: 'text-emerald-600',bg: 'bg-emerald-50' },
          { label: 'Employees Tracked',value: employees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="stat-card flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', s.bg)}>
              <s.icon size={20} className={s.color} />
            </div>
            <div><p className="text-2xl font-bold text-zinc-900">{s.value}</p><p className="text-xs text-zinc-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* QoQ Trend + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="col-span-2 card p-5">
          <h2 className="section-title mb-1">Quarter-on-Quarter Achievement Trend</h2>
          <p className="text-xs text-zinc-400 mb-4">Achievement % by department across Q1–Q4</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={qoqData}>
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} domain={[50, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }} />
              {[['Sales','#8b5cf6'],['Operations','#22c55e'],['Technology','#f59e0b'],['HR','#f43f5e']].map(([k,c]) => (
                <Line key={k} type="monotone" dataKey={k} stroke={c as string} strokeWidth={2.5} dot={{ r: 4, fill: c as string }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center flex-wrap">
            {[['Sales','#8b5cf6'],['Operations','#22c55e'],['Technology','#f59e0b'],['HR','#f43f5e']].map(([l,c]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <div className="w-3 h-3 rounded-full" style={{ background: c as string }} />{l}
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="section-title mb-4">Goal Area Radar</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f4f4f5" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
              <Radar name="Q1" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
              <Radar name="Q2" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap + Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="col-span-2 card p-5">
          <h2 className="section-title mb-1">Department Completion Heatmap</h2>
          <p className="text-xs text-zinc-400 mb-4">Check-in completion % by department and quarter</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header text-left pb-3">Department</th>
                  {['Q1','Q2','Q3','Q4'].map(q => <th key={q} className="table-header text-center pb-3">{q}</th>)}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map(row => (
                  <tr key={row.dept}>
                    <td className="py-2 pr-4 text-sm font-medium text-zinc-700">{row.dept}</td>
                    {['Q1','Q2','Q3','Q4'].map(q => {
                      const val = row[q as keyof typeof row] as number;
                      return (
                        <td key={q} className="py-2 px-2 text-center">
                          <div className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: heatColor(val), color: heatText(val) }}>
                            {val > 0 ? `${val}%` : '—'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100">
              {[['≥ 80%','#dcfce7','#15803d'],['50–79%','#fef3c7','#92400e'],['< 50%','#fee2e2','#991b1b'],['Not started','#f4f4f5','#a1a1aa']].map(([l,bg,cl]) => (
                <div key={l} className="flex items-center gap-1.5 text-xs">
                  <div className="w-4 h-4 rounded" style={{ background: bg as string }} />
                  <span style={{ color: cl as string }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Goal by Thrust Area</h2>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
              {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie><Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} /></PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
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

      {/* Manager Effectiveness + UoM breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="section-title mb-4">Manager Effectiveness</h2>
          <div className="space-y-3">
            {managerData.map(m => (
              <div key={m.name} className="flex items-center gap-3">
                <div className="w-20 text-sm font-medium text-zinc-700">{m.name}</div>
                <div className="flex-1">
                  <ProgressBar value={m.rate} variant={m.rate >= 80 ? 'success' : 'warning'} size="md" />
                </div>
                <span className={cn('text-xs font-bold w-10 text-right', m.rate >= 80 ? 'text-emerald-600' : 'text-amber-600')}>{m.rate}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="section-title mb-4">UoM Type Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={uomData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]}>
                {uomData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminAnalyticsPage;

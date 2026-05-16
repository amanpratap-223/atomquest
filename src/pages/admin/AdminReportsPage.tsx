import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { Badge } from '@/components/ui/Badge';
import { getThrustColor, cn } from '@/utils';
import { Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminReportsPage: React.FC = () => {
  const { goals, checkins } = useGoalStore();
  const { users } = useAuthStore();
  const employees = users.filter(u => u.role === 'employee');

  const handleExport = () => {
    const rows = ['Employee,Department,Goal Title,Thrust Area,UoM,Target,Weightage,Status,Q1 Achievement,Q1 Score'];
    employees.forEach(emp => {
      const empGoals = goals.filter(g => g.employeeId === emp.id);
      empGoals.forEach(goal => {
        const q1 = checkins.find(c => c.goalId === goal.id && c.period === 'Q1');
        rows.push(`"${emp.name}","${emp.department}","${goal.title}","${goal.thrustArea}","${goal.uomType}","${goal.target}","${goal.weightage}%","${goal.status}","${q1?.actualAchievement ?? '—'}","${q1 ? q1.progressScore + '%' : '—'}"`);
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'achievement-report.csv'; a.click();
    toast.success('Report exported!');
  };

  return (
    <AppLayout title="Reports" subtitle="Achievement and completion reports for FY 2025-26">
      <div className="flex justify-end mb-5">
        <button onClick={handleExport} className="btn-primary text-sm">
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
          <FileText size={16} className="text-zinc-400" />
          <span className="section-title">Achievement Report — Planned vs. Actual</span>
        </div>
        <table className="w-full">
          <thead className="bg-zinc-50">
            <tr>
              {['Employee','Goal Title','Thrust Area','UoM','Target','Weightage','Status','Q1 Achievement','Q1 Score'].map(h => (
                <th key={h} className="table-header text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {employees.map(emp => {
              const empGoals = goals.filter(g => g.employeeId === emp.id);
              return empGoals.map((goal, i) => {
                const q1 = checkins.find(c => c.goalId === goal.id && c.period === 'Q1');
                return (
                  <tr key={goal.id} className="hover:bg-zinc-50/50 transition-colors">
                    {i === 0 && (
                      <td className="table-cell font-medium" rowSpan={empGoals.length}>
                        <div>
                          <p className="font-semibold text-zinc-800">{emp.name}</p>
                          <p className="text-xs text-zinc-400">{emp.department}</p>
                        </div>
                      </td>
                    )}
                    <td className="table-cell max-w-[160px]">
                      <p className="text-sm font-medium text-zinc-700 truncate">{goal.title}</p>
                    </td>
                    <td className="table-cell">
                      <span className={cn('chip text-[10px]', getThrustColor(goal.thrustArea))}>
                        {goal.thrustArea.split(' & ')[0]}
                      </span>
                    </td>
                    <td className="table-cell"><Badge variant="info">{goal.uomType}</Badge></td>
                    <td className="table-cell text-zinc-600">{goal.uomType === 'Timeline' ? String(goal.target).split('T')[0] : goal.target}</td>
                    <td className="table-cell font-semibold text-zinc-700">{goal.weightage}%</td>
                    <td className="table-cell">
                      <Badge variant={goal.status === 'locked' ? 'locked' : goal.status as any}>
                        {goal.status}
                      </Badge>
                    </td>
                    <td className="table-cell text-zinc-600">{q1?.actualAchievement ?? <span className="text-zinc-300">—</span>}</td>
                    <td className="table-cell">
                      {q1 ? (
                        <span className={cn('font-bold text-sm', q1.progressScore >= 80 ? 'text-emerald-600' : q1.progressScore >= 50 ? 'text-amber-600' : 'text-rose-600')}>
                          {q1.progressScore}%
                        </span>
                      ) : <span className="text-zinc-300">—</span>}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default AdminReportsPage;

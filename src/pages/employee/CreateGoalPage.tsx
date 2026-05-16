import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { useGoalStore } from '@/store/goalStore';
import { ProgressBar } from '@/components/ui/Progress';
import { validateWeightage, cn } from '@/utils';
import { THRUST_AREAS, UOM_LABELS, UOM_DESCRIPTIONS, MAX_GOALS, MIN_WEIGHTAGE } from '@/types';
import type { UoMType } from '@/types';
import { ArrowLeft, CheckCircle2, AlertCircle, Info, Save, Plus, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  thrustArea:  z.string().min(1, 'Select a thrust area'),
  title:       z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  uomType:     z.enum(['Min', 'Max', 'Timeline', 'Zero'] as const),
  target:      z.union([z.number().positive('Target must be positive'), z.string().min(1)]),
  weightage:   z.number().min(10, 'Min 10%').max(100, 'Max 100%'),
});
type FormData = z.infer<typeof schema>;

const UOM_ICONS: Record<UoMType, string> = {
  Min: '📈', Max: '📉', Timeline: '📅', Zero: '🛡️',
};

const CreateGoalPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const { user } = useAuthStore();
  const { getMyGoals, addGoal, updateGoal } = useGoalStore();

  const [selectedUom, setSelectedUom] = useState<UoMType>('Min');

  if (!user) return null;
  const myGoals = getMyGoals(user.id);
  const editGoal = editId ? myGoals.find(g => g.id === editId) : null;
  const otherGoals = editGoal ? myGoals.filter(g => g.id !== editId) : myGoals;
  const otherWeightage = otherGoals.reduce((s, g) => s + g.weightage, 0);

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editGoal ? {
      thrustArea: editGoal.thrustArea,
      title: editGoal.title,
      description: editGoal.description,
      uomType: editGoal.uomType,
      target: editGoal.target as any,
      weightage: editGoal.weightage,
    } : { uomType: 'Min', weightage: 20 },
  });

  const watchedWeightage = watch('weightage', editGoal?.weightage || 20);
  const totalIfAdded = otherWeightage + Number(watchedWeightage || 0);
  const remaining = 100 - otherWeightage;
  const { isValid: weightageOk } = validateWeightage([...otherGoals.map(g => g.weightage), Number(watchedWeightage || 0)]);

  const validationChecks = [
    { ok: myGoals.length < MAX_GOALS || !!editGoal, label: `Max ${MAX_GOALS} goals (${myGoals.length}/${MAX_GOALS} used)` },
    { ok: Number(watchedWeightage) >= MIN_WEIGHTAGE, label: `Min ${MIN_WEIGHTAGE}% weightage per goal` },
    { ok: totalIfAdded <= 100, label: `Total weightage ≤ 100% (${totalIfAdded}% after this goal)` },
    { ok: totalIfAdded === 100, label: `Exactly 100% allocated` },
  ];

  useEffect(() => {
    if (editGoal) setSelectedUom(editGoal.uomType);
  }, [editGoal]);

  const onSubmit = async (data: FormData) => {
    await new Promise(r => setTimeout(r, 400));
    if (editGoal) {
      updateGoal(editGoal.id, { ...data, uomType: selectedUom, status: 'draft' });
      toast.success('Goal updated!');
    } else {
      addGoal({
        employeeId: user.id, cycleId: 'cy1',
        ...data, uomType: selectedUom,
        status: 'draft', isShared: false,
      });
      toast.success('Goal saved as draft!');
    }
    navigate('/employee/goals');
  };

  return (
    <AppLayout title={editGoal ? 'Edit Goal' : 'Create New Goal'} subtitle="My Goals › Create">
      <button onClick={() => navigate('/employee/goals')} className="btn-ghost mb-5 text-sm">
        <ArrowLeft size={16} /> Back to Goals
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-5">
          <div className="card p-6 space-y-5">
            {/* Thrust Area */}
            <div>
              <label className="label">Thrust Area</label>
              <select {...register('thrustArea')} className="input">
                <option value="">Select a thrust area...</option>
                {THRUST_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.thrustArea && <p className="mt-1 text-xs text-rose-500">{errors.thrustArea.message}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="label">Goal Title</label>
              <input {...register('title')} className="input" placeholder="e.g., Achieve Monthly Sales Target of ₹25L" />
              {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Describe the goal, success criteria, and context..." />
              {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description.message}</p>}
            </div>
          </div>

          {/* UoM Selection */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <label className="label mb-0">Unit of Measurement (UoM)</label>
              <HelpCircle size={14} className="text-zinc-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['Min', 'Max', 'Timeline', 'Zero'] as UoMType[]).map(uom => (
                <button
                  key={uom}
                  type="button"
                  onClick={() => { setSelectedUom(uom); setValue('uomType', uom); }}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    selectedUom === uom
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  )}
                >
                  <span className="text-xl flex-shrink-0">{UOM_ICONS[uom]}</span>
                  <div>
                    <p className={cn('text-sm font-semibold', selectedUom === uom ? 'text-violet-700' : 'text-zinc-700')}>
                      {UOM_LABELS[uom]}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{UOM_DESCRIPTIONS[uom]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target & Weightage */}
          <div className="card p-6 grid grid-cols-2 gap-5">
            <div>
              <label className="label">
                Target {selectedUom === 'Timeline' ? '(Deadline Date)' : '(Numeric)'}
              </label>
              {selectedUom === 'Timeline' ? (
                <input {...register('target')} type="date" className="input" />
              ) : (
                <input {...register('target', { valueAsNumber: true })} type="number" className="input"
                  placeholder={selectedUom === 'Zero' ? '0' : 'e.g., 100'} />
              )}
              {errors.target && <p className="mt-1 text-xs text-rose-500">{String(errors.target.message)}</p>}
            </div>

            <div>
              <label className="label">Weightage (%)</label>
              <Controller
                name="weightage"
                control={control}
                render={({ field }) => (
                  <div className="space-y-3">
                    <input
                      type="number"
                      {...field}
                      onFocus={e => e.target.select()}
                      onChange={e => field.onChange(Number(e.target.value))}
                      className="input"
                      min={10} max={100} step={5}
                    />
                    <input
                      type="range"
                      value={field.value}
                      onChange={e => field.onChange(Number(e.target.value))}
                      min={10} max={Math.min(remaining + (editGoal?.weightage || 0), 100)} step={5}
                      className="w-full accent-violet-600"
                    />
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Min: 10%</span>
                      <span className="text-violet-600 font-medium">{field.value}% selected</span>
                      <span>Remaining: {remaining}%</span>
                    </div>
                  </div>
                )}
              />
              {errors.weightage && <p className="mt-1 text-xs text-rose-500">{errors.weightage.message}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={() => navigate('/employee/goals')} className="btn-ghost">
              Cancel
            </button>
            <div className="flex gap-3">
              <button type="submit" className="btn-secondary">
                <Save size={16} /> Save as Draft
              </button>
              <button type="submit" disabled={!weightageOk || myGoals.length >= MAX_GOALS && !editGoal}
                className="btn-primary">
                <Plus size={16} /> {editGoal ? 'Update Goal' : 'Add Goal'}
              </button>
            </div>
          </div>
        </form>

        {/* Sidebar: Validation */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-20">
            <h3 className="section-title mb-4">Validation Checks</h3>
            <div className="space-y-2.5">
              {validationChecks.map(c => (
                <div key={c.label} className={cn('flex items-start gap-2.5 p-2.5 rounded-xl text-xs', c.ok ? 'bg-emerald-50' : 'bg-amber-50')}>
                  {c.ok
                    ? <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  }
                  <span className={c.ok ? 'text-emerald-700' : 'text-amber-700'}>{c.label}</span>
                </div>
              ))}
            </div>

            {/* Total Weightage Visual */}
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-zinc-500">Total Allocation</span>
                <span className={cn('text-xs font-bold', totalIfAdded === 100 ? 'text-emerald-600' : 'text-amber-600')}>
                  {totalIfAdded}%
                </span>
              </div>
              <ProgressBar
                value={totalIfAdded} max={100}
                variant={totalIfAdded === 100 ? 'success' : totalIfAdded > 100 ? 'danger' : 'warning'}
                size="md"
              />
            </div>

            <div className="mt-4 p-3 bg-zinc-50 rounded-xl">
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <Info size={13} className="flex-shrink-0 mt-0.5" />
                <span>Goals can only be edited in <strong>Draft</strong> or <strong>Returned</strong> state. Once approved, goals are locked.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateGoalPage;

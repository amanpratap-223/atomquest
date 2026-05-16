import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UoMType, GoalStatus, GoalProgressStatus } from '@/types';

// ─── Tailwind Class Merger ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Score Calculator ─────────────────────────────────────────────────────────
export function computeProgressScore(
  uomType: UoMType,
  target: number | string,
  achievement: number | string
): number {
  if (achievement === '' || achievement === null || achievement === undefined) return 0;

  switch (uomType) {
    case 'Min': {
      const t = Number(target);
      const a = Number(achievement);
      if (t === 0) return 0;
      return Math.min(Math.round((a / t) * 100), 100);
    }
    case 'Max': {
      const t = Number(target);
      const a = Number(achievement);
      if (a === 0) return 100;
      return Math.min(Math.round((t / a) * 100), 100);
    }
    case 'Timeline': {
      const deadline = new Date(target as string);
      const completion = new Date(achievement as string);
      return completion <= deadline ? 100 : 0;
    }
    case 'Zero': {
      return Number(achievement) === 0 ? 100 : 0;
    }
    default:
      return 0;
  }
}

// ─── Weightage Validator ─────────────────────────────────────────────────────
export function validateWeightage(weightages: number[]): {
  total: number;
  isValid: boolean;
  remaining: number;
  error?: string;
} {
  const total = weightages.reduce((sum, w) => sum + w, 0);
  const remaining = 100 - total;
  if (total > 100) return { total, isValid: false, remaining, error: 'Total weightage cannot exceed 100%' };
  if (weightages.some(w => w < 10)) return { total, isValid: false, remaining, error: 'Each goal must have at least 10% weightage' };
  return { total, isValid: total === 100, remaining };
}

// ─── Status Helpers ───────────────────────────────────────────────────────────
export function getStatusClass(status: GoalStatus): string {
  const map: Record<GoalStatus, string> = {
    draft: 'badge-draft',
    submitted: 'badge-submitted',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    locked: 'badge-locked',
  };
  return map[status] || 'badge-draft';
}

export function getProgressStatusClass(status: GoalProgressStatus): string {
  const map: Record<GoalProgressStatus, string> = {
    not_started: 'bg-zinc-100 text-zinc-600',
    on_track: 'bg-warning-100 text-warning-700',
    completed: 'bg-success-100 text-success-700',
  };
  return map[status];
}

export function getProgressStatusLabel(status: GoalProgressStatus): string {
  return { not_started: 'Not Started', on_track: 'On Track', completed: 'Completed' }[status];
}

// ─── Color Helpers ────────────────────────────────────────────────────────────
export const THRUST_COLORS: Record<string, string> = {
  'Sales & Revenue':        'bg-violet-100 text-violet-700',
  'Operations & Efficiency':'bg-blue-100 text-blue-700',
  'Customer Success':       'bg-emerald-100 text-emerald-700',
  'Product & Innovation':   'bg-orange-100 text-orange-700',
  'People & Culture':       'bg-pink-100 text-pink-700',
  'Finance & Cost':         'bg-amber-100 text-amber-700',
  'Quality & Compliance':   'bg-teal-100 text-teal-700',
  'Technology & Digital':   'bg-indigo-100 text-indigo-700',
};

export function getThrustColor(area: string): string {
  return THRUST_COLORS[area] || 'bg-zinc-100 text-zinc-600';
}

// ─── Score Ring Color ─────────────────────────────────────────────────────────
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#f43f5e';
}

// ─── Avatar Initials ──────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_BG = [
  'bg-violet-500','bg-pink-500','bg-orange-500','bg-teal-500',
  'bg-indigo-500','bg-emerald-500','bg-rose-500','bg-amber-500',
];
export function getAvatarBg(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_BG.length;
  return AVATAR_BG[idx];
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

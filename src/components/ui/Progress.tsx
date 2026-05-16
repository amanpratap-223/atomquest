import React from 'react';
import { cn } from '@/utils';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

const variantColors: Record<string, string> = {
  primary: 'bg-violet-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-rose-500',
};

const sizes = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, variant = 'primary', size = 'md',
  showLabel = false, className, animated = false,
}) => {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const color = pct >= 80 ? variantColors.success
              : pct >= 50 ? variantColors.warning
              : variantColors[variant];

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-zinc-100 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', color, animated && 'animate-pulse-soft')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-zinc-500">{value} / {max}%</span>
          <span className="text-xs font-medium text-zinc-700">{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
};

// ─── Score Ring ───────────────────────────────────────────────────────────────
interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 56, strokeWidth = 5, className }) => {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f4f4f5" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{score}%</span>
    </div>
  );
};

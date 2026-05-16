import React from 'react';
import { cn } from '@/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked' | 'info';
  className?: string;
}

const variants: Record<string, string> = {
  default:   'bg-zinc-100 text-zinc-600',
  draft:     'bg-zinc-100 text-zinc-500',
  submitted: 'bg-amber-100 text-amber-700',
  approved:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-700',
  locked:    'bg-violet-100 text-violet-700',
  info:      'bg-blue-100 text-blue-700',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => (
  <span className={cn(
    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
    variants[variant], className
  )}>
    {children}
  </span>
);

import React from 'react';
import { getInitials, getAvatarBg, cn } from '@/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg' };

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className }) => (
  <div className={cn(
    'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
    sizes[size], getAvatarBg(name), className
  )}>
    {getInitials(name)}
  </div>
);

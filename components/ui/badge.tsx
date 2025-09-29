import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'default' | 'lg';
}

function Badge({ className, variant = 'default', size = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-transparent bg-gradient-to-r from-primary-600 to-primary-500 text-primary-foreground shadow-sm': variant === 'default',
          'border-transparent bg-gradient-to-r from-secondary-500 to-secondary-400 text-secondary-foreground shadow-sm': variant === 'secondary',
          'border-transparent bg-gradient-to-r from-destructive-600 to-destructive-500 text-destructive-foreground shadow-sm': variant === 'destructive',
          'border-gray-200 bg-white text-gray-700 hover:bg-gray-50': variant === 'outline',
          'border-transparent bg-gradient-to-r from-success-600 to-success-500 text-success-foreground shadow-sm': variant === 'success',
          'border-transparent bg-gradient-to-r from-warning-500 to-warning-400 text-warning-foreground shadow-sm': variant === 'warning',
          'border-transparent bg-gradient-to-r from-accent-600 to-accent-500 text-accent-foreground shadow-sm': variant === 'info',
        },
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-xs': size === 'default',
          'px-4 py-1.5 text-sm': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
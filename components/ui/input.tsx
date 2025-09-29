import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search' | 'modern';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-lg border bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          {
            'h-10 px-4 py-2 border-gray-200 focus:border-primary-500 focus:ring-primary-100': variant === 'default',
            'h-11 px-4 py-3 border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-primary-100': variant === 'search',
            'h-12 px-6 py-3 border-gray-200 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-100 focus:shadow-md': variant === 'modern',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
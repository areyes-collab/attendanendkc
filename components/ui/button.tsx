import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
          {
            'bg-gradient-to-r from-primary-600 to-primary-500 text-primary-foreground hover:from-primary-700 hover:to-primary-600 shadow-lg hover:shadow-xl': variant === 'default',
            'bg-gradient-to-r from-destructive-600 to-destructive-500 text-destructive-foreground hover:from-destructive-700 hover:to-destructive-600 shadow-lg hover:shadow-xl': variant === 'destructive',
            'border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md': variant === 'outline',
            'bg-gradient-to-r from-secondary-500 to-secondary-400 text-secondary-foreground hover:from-secondary-600 hover:to-secondary-500 shadow-lg hover:shadow-xl': variant === 'secondary',
            'hover:bg-gray-100 hover:text-gray-900 rounded-lg': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
            'bg-gradient-to-r from-success-600 to-success-500 text-success-foreground hover:from-success-700 hover:to-success-600 shadow-lg hover:shadow-xl': variant === 'success',
            'bg-gradient-to-r from-warning-500 to-warning-400 text-warning-foreground hover:from-warning-600 hover:to-warning-500 shadow-lg hover:shadow-xl': variant === 'warning',
          },
          {
            'h-11 px-6 py-2.5': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'xs',
            'h-9 rounded-lg px-4 text-sm': size === 'sm',
            'h-12 rounded-lg px-8 text-base': size === 'lg',
            'h-10 w-10 rounded-lg': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
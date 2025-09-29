'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'primary',
  className 
}: StatCardProps) {
  const variantClasses = {
    primary: 'stat-card-primary',
    secondary: 'stat-card-secondary', 
    accent: 'stat-card-accent',
    success: 'stat-card-success',
    warning: 'stat-card-warning',
    destructive: 'stat-card-destructive',
  };

  const iconColors = {
    primary: 'text-primary-600 bg-primary-100',
    secondary: 'text-secondary-600 bg-secondary-100',
    accent: 'text-accent-600 bg-accent-100',
    success: 'text-success-600 bg-success-100',
    warning: 'text-warning-600 bg-warning-100',
    destructive: 'text-destructive-600 bg-destructive-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card className={cn('stat-card', variantClasses[variant], className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600 tracking-wide uppercase">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {value}
              </p>
              {trend && (
                <span className={cn(
                  'text-xs font-semibold px-2 py-1 rounded-full',
                  trend.isPositive 
                    ? 'text-success-700 bg-success-100' 
                    : 'text-destructive-700 bg-destructive-100'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
          </div>
          
          <div className={cn(
            'p-3 rounded-xl shadow-sm',
            iconColors[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </CardHeader>
        
        {subtitle && (
          <CardContent className="pt-0">
            <p className="text-sm text-gray-500 leading-relaxed">
              {subtitle}
            </p>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
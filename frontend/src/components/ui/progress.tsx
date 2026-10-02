import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getRiskScoreColor } from '@/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  showLabel?: boolean;
  variant?: 'default' | 'risk';
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, showLabel = false, variant = 'default', ...props }, ref) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const getBarColor = (val: number) => {
    if (variant === 'risk') {
      if (val <= 25) return 'bg-emerald-500';
      if (val <= 50) return 'bg-amber-500';
      if (val <= 75) return 'bg-orange-500';
      return 'bg-red-500';
    }
    return 'bg-primary';
  };

  return (
    <div className="relative w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator asChild>
          <motion.div
            className={cn('h-full w-full flex-1 rounded-full transition-colors', getBarColor(clampedValue))}
            initial={{ width: 0 }}
            animate={{ width: `${clampedValue}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>
      {showLabel && (
        <span className={cn(
          'absolute -top-6 right-0 text-xs font-medium',
          getRiskScoreColor(clampedValue)
        )}>
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

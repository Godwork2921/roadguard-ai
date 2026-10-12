import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
        outline: 'text-foreground',
        low: 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm',
        medium: 'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm',
        high: 'border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400 shadow-sm',
        critical: 'border-transparent bg-red-500/15 text-red-600 dark:text-red-400 shadow-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLMotionProps<'div'>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

function Badge({ className, variant, pulse, ...props }: BadgeProps) {
  return (
    <motion.div
      className={cn(badgeVariants({ variant }), pulse && 'animate-pulse-glow', className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

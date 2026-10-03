import * as React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusDotVariants = cva(
  'relative inline-flex h-2.5 w-2.5 rounded-full',
  {
    variants: {
      status: {
        active: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-red-500',
        inactive: 'bg-gray-400',
      },
    },
    defaultVariants: {
      status: 'inactive',
    },
  }
);

interface StatusDotProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusDotVariants> {
  pulse?: boolean;
  label?: string;
}

function StatusDot({ className, status, pulse = true, label, ...props }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-flex">
        <motion.span
          className={cn(statusDotVariants({ status }), className)}
          animate={
            pulse
              ? {
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.7, 1],
                }
              : {}
          }
          transition={
            pulse
              ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
          {...props}
        />
        {pulse && (
          <motion.span
            className={cn(
              'absolute inset-0 rounded-full',
              status === 'active' && 'bg-emerald-500',
              status === 'warning' && 'bg-amber-500',
              status === 'danger' && 'bg-red-500',
              status === 'inactive' && 'bg-gray-400'
            )}
            animate={{
              scale: [1, 2],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </span>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </span>
  );
}

export { StatusDot };

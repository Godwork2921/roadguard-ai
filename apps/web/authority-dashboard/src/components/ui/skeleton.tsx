import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva(
  'animate-shimmer bg-gradient-to-r from-muted via-muted/80 to-muted bg-[length:200%_100%] rounded-md',
  {
    variants: {
      variant: {
        text: 'h-4 w-full rounded',
        circular: 'h-10 w-10 rounded-full',
        rectangular: 'h-20 w-full rounded-lg',
        card: 'h-40 w-full rounded-xl',
        'table-row': 'h-12 w-full rounded',
      },
    },
    defaultVariants: {
      variant: 'text',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  count?: number;
}

function Skeleton({ className, variant, count = 1, ...props }: SkeletonProps) {
  if (count > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(skeletonVariants({ variant }), className)}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

function SkeletonCard({ lines = 3, className, ...props }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-xl border border-border/50 p-6 space-y-4', className)} {...props}>
      <Skeleton variant="text" className="w-3/4 h-5" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" className={i === lines - 1 ? 'w-1/2' : 'w-full'} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard };

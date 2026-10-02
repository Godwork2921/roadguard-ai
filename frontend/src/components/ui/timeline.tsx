import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  icon?: React.ReactNode;
  status?: 'completed' | 'current' | 'pending' | 'error';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500',
  current: 'bg-primary',
  pending: 'bg-muted-foreground/30',
  error: 'bg-red-500',
};

const statusIconColors: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  current: 'bg-primary/10 text-primary border-primary/20',
  pending: 'bg-muted text-muted-foreground border-border',
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
};

function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="relative flex gap-4 pb-8 last:pb-0"
        >
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium',
                statusIconColors[item.status ?? 'pending']
              )}
            >
              {item.icon || (
                <div className={cn('h-2.5 w-2.5 rounded-full', statusColors[item.status ?? 'pending'])} />
              )}
            </div>
            {index < items.length - 1 && (
              <div className="mt-2 h-full w-px bg-border" />
            )}
          </div>
          <div className="flex-1 pt-1.5 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                )}
              </div>
              {item.timestamp && (
                <span className="text-xs text-muted-foreground shrink-0">{item.timestamp}</span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export { Timeline };
export type { TimelineItem, TimelineProps };

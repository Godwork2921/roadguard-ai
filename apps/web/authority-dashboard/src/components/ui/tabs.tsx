import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const tabsVariants = cva('', {
  variants: {
    variant: {
      underline: '',
      pills: '',
    },
  },
  defaultVariants: {
    variant: 'underline',
  },
});

const Tabs = TabsPrimitive.Root;

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1',
      variant === 'underline' &&
        'border-b border-border w-full',
      variant === 'pills' &&
        'rounded-xl bg-muted/50 p-1',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: 'underline' | 'pills';
  }
>(({ className, variant = 'underline', children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'group relative inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
      variant === 'underline' &&
        'text-muted-foreground hover:text-foreground data-[state=active]:text-foreground',
      variant === 'pills' &&
        'rounded-lg text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  >
    {variant === 'underline' && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        layoutId="tab-indicator"
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
    {children}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };

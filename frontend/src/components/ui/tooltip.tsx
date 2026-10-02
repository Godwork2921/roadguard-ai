import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-lg border border-border/50 bg-popover/95 backdrop-blur-xl px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-xl',
        className
      )}
      asChild
      {...props}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 2 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-popover" />
      </motion.div>
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

interface RichTooltipProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function RichTooltip({ title, description, icon, children }: RichTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="p-3 max-w-[220px]">
          <div className="flex items-start gap-2">
            {icon && <div className="mt-0.5">{icon}</div>}
            <div>
              <p className="font-semibold text-sm">{title}</p>
              {description && (
                <p className="text-muted-foreground text-xs mt-0.5">{description}</p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, RichTooltip };

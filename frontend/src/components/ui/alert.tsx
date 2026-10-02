import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        info: 'bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-300 [&>svg]:text-blue-500',
        success: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 [&>svg]:text-emerald-500',
        warning: 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300 [&>svg]:text-amber-500',
        error: 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-300 [&>svg]:text-red-500',
        destructive: 'bg-destructive/10 border-destructive/20 text-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const alertIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  destructive: AlertCircle,
};

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean;
  icon?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', dismissible, icon = true, children, ...props }, ref) => {
    const [dismissed, setDismissed] = React.useState(false);
    const IconComponent = alertIcons[variant ?? 'info'];

    return (
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(alertVariants({ variant }), className)}
            role="alert"
            {...props}
          >
            {icon && <IconComponent className="h-5 w-5" />}
            <div className={cn('flex-1', icon && 'pl-7')}>
              {children}
            </div>
            {dismissible && (
              <button
                onClick={() => setDismissed(true)}
                className="absolute right-3 top-3 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm opacity-90 [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };

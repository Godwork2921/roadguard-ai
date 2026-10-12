import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusDotVariants = cva(
  'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background',
  {
    variants: {
      status: {
        online: 'bg-emerald-500',
        offline: 'bg-gray-400',
        away: 'bg-amber-500',
        busy: 'bg-red-500',
      },
    },
    defaultVariants: {
      status: 'offline',
    },
  }
);

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

interface AvatarWithStatusProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const AvatarWithStatus = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarWithStatusProps
>(({ status = 'offline', children, className, ...props }, ref) => (
  <div className="relative inline-flex">
    <Avatar ref={ref} className={className} {...props}>
      {children}
    </Avatar>
    <span className={cn(statusDotVariants({ status }))} />
  </div>
));
AvatarWithStatus.displayName = 'AvatarWithStatus';

export { Avatar, AvatarImage, AvatarFallback, AvatarWithStatus, statusDotVariants };

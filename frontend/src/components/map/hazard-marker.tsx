import * as React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Circle,
  Droplets,
  Car,
  Construction,
  TreePine,
  Package,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HazardType, HazardSeverity, HazardStatus } from '@/types';

interface HazardMarkerProps {
  type: HazardType;
  severity: HazardSeverity;
  status: HazardStatus;
  latitude: number;
  longitude: number;
  confidenceScore?: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const severityColors: Record<HazardSeverity, { bg: string; border: string; shadow: string; pulse: string }> = {
  LOW: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
    shadow: 'shadow-emerald-500/30',
    pulse: 'bg-emerald-500/30',
  },
  MEDIUM: {
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    shadow: 'shadow-amber-500/30',
    pulse: 'bg-amber-500/30',
  },
  HIGH: {
    bg: 'bg-orange-500',
    border: 'border-orange-400',
    shadow: 'shadow-orange-500/30',
    pulse: 'bg-orange-500/30',
  },
  CRITICAL: {
    bg: 'bg-red-500',
    border: 'border-red-400',
    shadow: 'shadow-red-500/30',
    pulse: 'bg-red-500/30',
  },
};

const hazardIcons: Record<HazardType, React.ElementType> = {
  POTHOLE: Circle,
  ROAD_CRACK: AlertTriangle,
  FLOOD: Droplets,
  ACCIDENT: Car,
  ROAD_BLOCKAGE: Construction,
  CONSTRUCTION: Construction,
  ANIMAL_CROSSING: TreePine,
  DEBRIS: Package,
  OTHER: HelpCircle,
};

const sizes: Record<string, { marker: string; icon: string; pulse: string }> = {
  sm: { marker: 'h-6 w-6', icon: 'h-3 w-3', pulse: 'h-8 w-8' },
  md: { marker: 'h-8 w-8', icon: 'h-4 w-4', pulse: 'h-12 w-12' },
  lg: { marker: 'h-10 w-10', icon: 'h-5 w-5', pulse: 'h-16 w-16' },
};

function HazardMarker({
  type,
  severity,
  status,
  confidenceScore,
  selected = false,
  onClick,
  className,
  size = 'md',
}: HazardMarkerProps) {
  const colors = severityColors[severity];
  const Icon = hazardIcons[type];
  const dims = sizes[size];

  const isActive = status === 'DETECTED' || status === 'REPORTED';
  const isResolved = status === 'RESOLVED' || status === 'FIXED';
  const isRejected = status === 'REJECTED';

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      {isActive && (
        <motion.span
          className={cn(
            'absolute rounded-full',
            colors.pulse,
            dims.pulse
          )}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <motion.button
        whileHover={{ scale: 1.15, y: -4 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 shadow-lg transition-transform cursor-pointer',
          colors.bg,
          colors.border,
          colors.shadow,
          dims.marker,
          isResolved && 'opacity-50 grayscale',
          isRejected && 'opacity-40 grayscale',
          selected && 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110'
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: isResolved || isRejected ? 0.6 : 1,
          y: isActive ? [0, -4, 0] : 0,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 400, damping: 20 },
          y: isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : undefined,
        }}
      >
        <Icon className={cn(dims.icon, 'text-white')} />
      </motion.button>

      {confidenceScore !== undefined && size !== 'sm' && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm',
            colors.bg
          )}
        >
          {confidenceScore}%
        </motion.span>
      )}
    </div>
  );
}

function HazardMarkerPopup({
  type,
  severity,
  status,
  description,
  confidenceScore,
  reportedAt,
  onClose,
  onViewDetails,
}: {
  type: HazardType;
  severity: HazardSeverity;
  status: HazardStatus;
  description?: string;
  confidenceScore?: number;
  reportedAt?: string;
  onClose: () => void;
  onViewDetails?: () => void;
}) {
  const colors = severityColors[severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl p-3 shadow-xl min-w-[200px] max-w-[260px]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={cn('h-2.5 w-2.5 rounded-full', colors.bg)} />
          <span className="text-xs font-semibold capitalize">{type.replace(/_/g, ' ').toLowerCase()}</span>
        </div>
        <button onClick={onClose} className="rounded-full p-0.5 hover:bg-accent transition-colors">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={cn(
          'px-1.5 py-0.5 rounded text-[10px] font-semibold text-white',
          colors.bg
        )}>
          {severity}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
          {status}
        </span>
        {confidenceScore && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
            {confidenceScore}% conf.
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{description}</p>
      )}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="text-xs font-medium text-primary hover:underline"
        >
          View details →
        </button>
      )}
    </motion.div>
  );
}

export { HazardMarker, HazardMarkerPopup };
export type { HazardMarkerProps };

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn, getRiskScoreColor } from '@/lib/utils';

interface RiskIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizes = {
  sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
  md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
  lg: { width: 160, strokeWidth: 10, fontSize: 'text-3xl' },
};

function RiskIndicator({
  score,
  size = 'md',
  showLabel = true,
  className,
}: RiskIndicatorProps) {
  const { width, strokeWidth, fontSize } = sizes[size];
  const center = width / 2;
  const radius = center - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const filledLength = (clampedScore / 100) * circumference;

  const getArcColor = (val: number) => {
    if (val <= 25) return '#22c55e';
    if (val <= 50) return '#eab308';
    if (val <= 75) return '#f97316';
    return '#ef4444';
  };

  const getLabel = (val: number) => {
    if (val <= 25) return 'Low';
    if (val <= 50) return 'Moderate';
    if (val <= 75) return 'High';
    return 'Critical';
  };

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg width={width} height={width} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={getArcColor(clampedScore)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - filledLength }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn('font-bold', fontSize, getRiskScoreColor(clampedScore))}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
        >
          {Math.round(clampedScore)}
        </motion.span>
        {showLabel && (
          <span className="text-[10px] font-medium text-muted-foreground mt-[-2px]">
            {getLabel(clampedScore)}
          </span>
        )}
      </div>
    </div>
  );
}

export { RiskIndicator };

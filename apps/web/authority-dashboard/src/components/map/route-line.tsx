import * as React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Coordinates, RiskLevel } from '@/types';

interface RoutePoint extends Coordinates {
  elevation?: number;
}

interface RouteLineProps {
  coordinates: RoutePoint[];
  riskLevel?: RiskLevel;
  riskScore?: number;
  animated?: boolean;
  dashed?: boolean;
  selected?: boolean;
  color?: string;
  weight?: number;
  opacity?: number;
  label?: string;
  onClick?: () => void;
  className?: string;
}

const riskColors: Record<RiskLevel, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const riskBorderColors: Record<RiskLevel, string> = {
  LOW: 'rgba(34,197,94,0.3)',
  MEDIUM: 'rgba(234,179,8,0.3)',
  HIGH: 'rgba(249,115,22,0.3)',
  CRITICAL: 'rgba(239,68,68,0.3)',
};

function RouteLine({
  coordinates,
  riskLevel = 'LOW',
  riskScore,
  animated = true,
  dashed = false,
  selected = false,
  color,
  weight = 4,
  opacity = 0.8,
  label,
  onClick,
  className,
}: RouteLineProps) {
  const lineColor = color || riskColors[riskLevel];
  const [drawProgress, setDrawProgress] = React.useState(animated ? 0 : 1);
  const pathRef = React.useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = React.useState(0);

  React.useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [coordinates]);

  React.useEffect(() => {
    if (animated) {
      const controls = animate(drawProgress, 1, {
        duration: 1.5,
        ease: 'easeInOut',
        onUpdate: (latest) => setDrawProgress(latest),
      });
      return () => controls.stop();
    }
  }, [animated, coordinates]);

  const buildPath = (pts: RoutePoint[]): string => {
    if (pts.length < 2) return '';
    const first = pts[0];
    let path = `M ${first.lng} ${first.lat}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.lng + curr.lng) / 2;
      const cpy = (prev.lat + curr.lat) / 2;
      path += ` Q ${prev.lng} ${prev.lat}, ${cpx} ${cpy}`;
      path += ` Q ${cpx} ${cpy}, ${curr.lng} ${curr.lat}`;
    }
    return path;
  };

  const pathD = buildPath(coordinates);

  if (coordinates.length < 2) return null;

  return (
    <motion.g
      className={cn('route-line', className)}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {selected && (
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={(weight || 4) + 8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.15}
        />
      )}

      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth={weight || 4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        strokeDasharray={dashed ? '8,6' : 'none'}
        strokeDashoffset={animated ? pathLength * (1 - drawProgress) : 0}
        className={cn(
          'transition-all',
          dashed && 'animate-dash-line'
        )}
        style={
          animated
            ? {
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength * (1 - drawProgress),
              }
            : undefined
        }
      />

      {animated && coordinates.length > 1 && (
        <motion.circle
          r={4}
          fill={lineColor}
          stroke="white"
          strokeWidth={2}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            ...getPointAtProgress(coordinates, drawProgress),
          }}
        />
      )}

      <circle
        cx={coordinates[0].lng}
        cy={coordinates[0].lat}
        r={5}
        fill={lineColor}
        stroke="white"
        strokeWidth={2}
      />
      <circle
        cx={coordinates[coordinates.length - 1].lng}
        cy={coordinates[coordinates.length - 1].lat}
        r={5}
        fill={lineColor}
        stroke="white"
        strokeWidth={2}
      />

      {label && (
        <text
          x={(coordinates[0].lng + coordinates[coordinates.length - 1].lng) / 2}
          y={(coordinates[0].lat + coordinates[coordinates.length - 1].lat) / 2 - 12}
          fill={lineColor}
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
          className="drop-shadow-sm"
        >
          {label}
          {riskScore !== undefined && ` · ${riskScore}`}
        </text>
      )}
    </motion.g>
  );
}

function getPointAtProgress(coords: RoutePoint[], progress: number): { cx: number; cy: number } | {} {
  if (coords.length < 2 || progress <= 0) return { cx: coords[0].lng, cy: coords[0].lat };
  if (progress >= 1) return { cx: coords[coords.length - 1].lng, cy: coords[coords.length - 1].lat };

  const totalSegments = coords.length - 1;
  const totalProgress = progress * totalSegments;
  const segmentIndex = Math.floor(totalProgress);
  const segmentProgress = totalProgress - segmentIndex;

  if (segmentIndex >= totalSegments) {
    return { cx: coords[coords.length - 1].lng, cy: coords[coords.length - 1].lat };
  }

  const from = coords[segmentIndex];
  const to = coords[segmentIndex + 1];

  return {
    cx: from.lng + (to.lng - from.lng) * segmentProgress,
    cy: from.lat + (to.lat - from.lat) * segmentProgress,
  };
}

function RouteLineGroup({
  routes,
  selectedIndex,
  onSelect,
}: {
  routes: { coordinates: RoutePoint[]; riskLevel: RiskLevel; riskScore?: number; label?: string }[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <g>
      {routes.map((route, idx) => (
        <RouteLine
          key={idx}
          {...route}
          selected={selectedIndex === idx}
          animated={idx === (selectedIndex ?? 0)}
          dashed={idx !== (selectedIndex ?? 0)}
          onClick={() => onSelect?.(idx)}
        />
      ))}
    </g>
  );
}

export { RouteLine, RouteLineGroup };
export type { RouteLineProps, RoutePoint };

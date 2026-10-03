import * as React from 'react';
import { motion } from 'framer-motion';
import { Map, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { MapHazard, MapRiskZone, MapActiveTrip, MapAnomaly, Coordinates } from '@/types';

interface MarkerConfig {
  id: string;
  latitude: number;
  longitude: number;
  element?: React.ReactNode;
  color?: string;
  popup?: React.ReactNode;
}

interface RouteConfig {
  coordinates: Coordinates[];
  color?: string;
  dashed?: boolean;
  animated?: boolean;
  weight?: number;
}

interface MapViewProps {
  center?: Coordinates;
  zoom?: number;
  markers?: MarkerConfig[];
  route?: RouteConfig;
  hazardMarkers?: MapHazard[];
  riskZones?: MapRiskZone[];
  activeTrips?: MapActiveTrip[];
  heatmapData?: MapAnomaly[];
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onBoundsChange?: (bounds: { sw: Coordinates; ne: Coordinates }) => void;
  onMarkerClick?: (id: string) => void;
  onMapClick?: (coords: Coordinates) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function MapView({
  center = { lat: 40.7128, lng: -74.006 },
  zoom = 12,
  markers = [],
  route,
  hazardMarkers = [],
  riskZones = [],
  activeTrips = [],
  heatmapData = [],
  interactive = true,
  className,
  style,
  onBoundsChange,
  onMarkerClick,
  onMapClick,
  loading = false,
  error = null,
  onRetry,
}: MapViewProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [mapError, setMapError] = React.useState<string | null>(error);

  React.useEffect(() => {
    setMapError(error);
  }, [error]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleFlyTo = (coords: Coordinates, flyZoom?: number) => {};
  const handleFitBounds = (bounds: { sw: Coordinates; ne: Coordinates }) => {};

  if (loading || !mapLoaded) {
    return (
      <div className={cn('relative rounded-xl overflow-hidden', className)} style={style}>
        <Skeleton variant="rectangular" className="h-full w-full rounded-none" />
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={cn('relative rounded-xl overflow-hidden', className)} style={style}>
        <div className="h-full w-full bg-muted flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 mx-auto">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-semibold">Failed to load map</p>
              <p className="text-sm text-muted-foreground mt-1">{mapError}</p>
            </div>
            {onRetry && (
              <Button variant="outline" className="gap-2" onClick={onRetry}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getRiskZoneColor = (level: string): string => {
    switch (level) {
      case 'CRITICAL': return 'rgba(239,68,68,0.15)';
      case 'HIGH': return 'rgba(249,115,22,0.12)';
      case 'MEDIUM': return 'rgba(234,179,8,0.1)';
      case 'LOW': return 'rgba(34,197,94,0.08)';
      default: return 'rgba(107,114,128,0.08)';
    }
  };

  return (
    <motion.div
      ref={mapRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative rounded-xl overflow-hidden bg-gradient-to-br from-muted via-background to-muted',
        interactive && 'cursor-crosshair',
        className
      )}
      style={style}
      onClick={(e) => {
        if (!onMapClick || !interactive) return;
        const rect = mapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const lng = center.lng + (x - 0.5) * 0.2;
        const lat = center.lat - (y - 0.5) * 0.15;
        onMapClick({ lat, lng });
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03)_0%,transparent_60%)]" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <Map className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-xs text-muted-foreground/30 mt-1">
          {center.lat.toFixed(4)}, {center.lng.toFixed(4)} · Zoom {zoom}
        </p>
      </div>

      {hazardMarkers.map((hazard) => (
        <motion.button
          key={hazard.id}
          className="absolute z-10"
          style={{
            left: `${((hazard.longitude - center.lng + 0.1) / 0.2) * 100}%`,
            top: `${((center.lat + 0.075 - hazard.latitude) / 0.15) * 100}%`,
          }}
          animate={{
            scale: hazard.status === 'DETECTED' || hazard.status === 'REPORTED' ? [1, 1.3, 1] : 1,
          }}
          transition={hazard.status === 'DETECTED' || hazard.status === 'REPORTED' ? { duration: 2, repeat: Infinity } : undefined}
          onClick={(e) => { e.stopPropagation(); onMarkerClick?.(hazard.id); }}
          whileHover={{ scale: 1.5, zIndex: 20 }}
        >
          <div
            className="h-3.5 w-3.5 rounded-full border-2 border-background shadow-lg"
            style={{ backgroundColor: getSeverityColor(hazard.severity) }}
          />
        </motion.button>
      ))}

      {markers.map((marker) => (
        <div
          key={marker.id}
          className="absolute z-10"
          style={{
            left: `${((marker.longitude - center.lng + 0.1) / 0.2) * 100}%`,
            top: `${((center.lat + 0.075 - marker.latitude) / 0.15) * 100}%`,
          }}
        >
          {marker.element || (
            <div
              className="h-3 w-3 rounded-full border-2 border-background shadow-lg"
              style={{ backgroundColor: marker.color || '#3b82f6' }}
            />
          )}
        </div>
      ))}

      {route && (
        <svg className="absolute inset-0 h-full w-full pointer-events-none z-10">
          <polyline
            points={route.coordinates
              .map((c) => {
                const x = ((c.lng - center.lng + 0.1) / 0.2) * 100;
                const y = ((center.lat + 0.075 - c.lat) / 0.15) * 100;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke={route.color || '#3b82f6'}
            strokeWidth={route.weight || 3}
            strokeDasharray={route.dashed ? '8,4' : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={route.animated ? 'animate-dash' : undefined}
          />
        </svg>
      )}

      {riskZones.map((zone) => (
        <motion.div
          key={zone.id}
          className="absolute z-5 rounded-full pointer-events-none"
          style={{
            left: `${((zone.longitude - center.lng + 0.1) / 0.2) * 100 - 8}%`,
            top: `${((center.lat + 0.075 - zone.latitude) / 0.15) * 100 - 8}%`,
            width: '16%',
            paddingBottom: '16%',
            backgroundColor: getRiskZoneColor(zone.riskLevel),
            border: `1px solid ${getRiskZoneColor(zone.riskLevel).replace('0.15', '0.3').replace('0.12', '0.25').replace('0.1', '0.2').replace('0.08', '0.15')}`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      ))}

      {activeTrips.map((trip) => (
        <motion.div
          key={trip.id}
          className="absolute z-10"
          style={{
            left: `${((trip.longitude - center.lng + 0.1) / 0.2) * 100}%`,
            top: `${((center.lat + 0.075 - trip.latitude) / 0.15) * 100}%`,
          }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-background shadow-lg flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
        </motion.div>
      ))}

      {heatmapData.length > 0 && (
        <div className="absolute inset-0 z-5 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 30% 40%, rgba(239,68,68,0.08) 0%, transparent 50%),
                          radial-gradient(circle at 60% 30%, rgba(249,115,22,0.06) 0%, transparent 40%),
                          radial-gradient(circle at 45% 60%, rgba(234,179,8,0.05) 0%, transparent 45%)`,
            }}
          />
        </div>
      )}

      {interactive && (
        <div className="absolute bottom-3 left-3 z-20 flex gap-1.5">
          <button
            className="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-accent transition-colors shadow-sm"
            onClick={(e) => { e.stopPropagation(); handleFlyTo(center, Math.min(zoom + 1, 18)); }}
          >
            <span className="text-sm font-bold text-muted-foreground">+</span>
          </button>
          <button
            className="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-accent transition-colors shadow-sm"
            onClick={(e) => { e.stopPropagation(); handleFlyTo(center, Math.max(zoom - 1, 1)); }}
          >
            <span className="text-sm font-bold text-muted-foreground">−</span>
          </button>
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-20 glass rounded-lg px-2.5 py-1.5 text-[10px] text-muted-foreground shadow-sm">
        <div className="flex items-center gap-2">
          <span>Lat: {center.lat.toFixed(4)}</span>
          <span>Lng: {center.lng.toFixed(4)}</span>
          <span>Z: {zoom}</span>
        </div>
      </div>
    </motion.div>
  );
}

export { MapView };
export type { MapViewProps, MarkerConfig, RouteConfig };

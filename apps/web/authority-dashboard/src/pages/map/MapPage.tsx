import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Navigation,
  Shield,
  Thermometer,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  Circle,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/components/layout/page-container';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { HazardSeverity, HazardType, HazardStatus } from '@/types';

interface MapHazard {
  id: string;
  type: HazardType;
  severity: HazardSeverity;
  status: HazardStatus;
  latitude: number;
  longitude: number;
  description: string;
  reportedAt: string;
}

const mockHazards: MapHazard[] = Array.from({ length: 20 }, (_, i) => ({
  id: `mh-${i}`,
  type: (['POTHOLE', 'FLOOD', 'ACCIDENT', 'ROAD_BLOCKAGE', 'CONSTRUCTION', 'DEBRIS'] as HazardType[])[i % 6],
  severity: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as HazardSeverity[])[i % 4],
  status: (['DETECTED', 'REPORTED', 'VERIFIED', 'ASSIGNED', 'RESOLVED'] as HazardStatus[])[i % 5],
  latitude: 40.7128 + (Math.random() - 0.5) * 0.08,
  longitude: -74.006 + (Math.random() - 0.5) * 0.08,
  description: `${['Large pothole', 'Road flooding', 'Traffic accident', 'Fallen tree', 'Construction zone', 'Debris on road'][i % 6]} near ${['Broadway', '5th Ave', 'Park Ave', 'Madison Ave'][i % 4]}`,
  reportedAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

const severityColor: Record<string, string> = {
  CRITICAL: 'text-red-500 bg-red-500/10 border-red-500/20',
  HIGH: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  MEDIUM: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  LOW: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
};

const severityDot: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-emerald-500',
};

export default function MapPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [selectedHazard, setSelectedHazard] = React.useState<MapHazard | null>(null);
  const [layers, setLayers] = React.useState({
    hazards: true,
    riskZones: true,
    activeTrips: true,
    heatmap: false,
  });
  const [filters, setFilters] = React.useState({ severity: 'all', type: 'all' });
  const [search, setSearch] = React.useState('');

  const filteredHazards = mockHazards.filter((h) => {
    if (filters.severity !== 'all' && h.severity !== filters.severity) return false;
    if (filters.type !== 'all' && h.type !== filters.type) return false;
    if (search && !h.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className={cn(
      'relative h-[calc(100vh-4rem)] overflow-hidden',
      fullscreen && 'fixed inset-0 z-50 h-screen'
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03)_0%,transparent_60%)]" />

        {filteredHazards.map((hazard) => (
          <motion.button
            key={hazard.id}
            className={cn(
              'absolute h-4 w-4 rounded-full border-2 border-background shadow-lg transition-transform',
              severityDot[hazard.severity]
            )}
            style={{
              left: `${((hazard.longitude + 74.05) / 0.12) * 100}%`,
              top: `${((40.78 - hazard.latitude) / 0.08) * 100}%`,
            }}
            animate={{
              scale: hazard.severity === 'CRITICAL' ? [1, 1.3, 1] : 1,
              opacity: hazard.severity === 'CRITICAL' ? [0.7, 1, 0.7] : 1,
            }}
            transition={hazard.severity === 'CRITICAL' ? { duration: 2, repeat: Infinity } : undefined}
            onClick={(e) => { e.stopPropagation(); setSelectedHazard(selectedHazard?.id === hazard.id ? null : hazard); }}
            whileHover={{ scale: 1.5, zIndex: 10 }}
          />
        ))}

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <Map className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground/30 mt-2">MapLibre GL map placeholder</p>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-10 w-10 rounded-xl bg-background/80 backdrop-blur-xl border border-border/50 flex items-center justify-center shadow-lg hover:bg-accent transition-colors"
          onClick={() => setFullscreen(!fullscreen)}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </motion.button>

        {[
          { icon: ZoomIn, label: 'Zoom in' },
          { icon: ZoomOut, label: 'Zoom out' },
        ].map(({ icon: Icon, label }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-10 w-10 rounded-xl bg-background/80 backdrop-blur-xl border border-border/50 flex items-center justify-center shadow-lg hover:bg-accent transition-colors"
            title={label}
          >
            <Icon className="h-4 w-4" />
          </motion.button>
        ))}
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Card className="bg-background/80 backdrop-blur-xl border-border/50 shadow-lg">
          <CardContent className="p-2 space-y-1">
            {[
              { key: 'hazards' as const, label: 'Hazards', icon: AlertTriangle, color: 'text-red-500' },
              { key: 'riskZones' as const, label: 'Risk Zones', icon: Shield, color: 'text-amber-500' },
              { key: 'activeTrips' as const, label: 'Active Trips', icon: Navigation, color: 'text-blue-500' },
              { key: 'heatmap' as const, label: 'Heatmap', icon: Thermometer, color: 'text-purple-500' },
            ].map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  layers[key] ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', layers[key] && color)} />
                {label}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute left-4 top-16 bottom-4 z-10 w-[300px]"
          >
            <Card className="h-full bg-background/80 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Hazards</CardTitle>
                  <Badge variant="destructive" className="text-xs">{filteredHazards.length}</Badge>
                </div>
                <Input
                  placeholder="Search hazards..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-1.5 mt-1">
                  <Select value={filters.severity} onValueChange={(v) => setFilters((p) => ({ ...p, severity: v }))}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.type} onValueChange={(v) => setFilters((p) => ({ ...p, type: v }))}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="POTHOLE">Pothole</SelectItem>
                      <SelectItem value="FLOOD">Flood</SelectItem>
                      <SelectItem value="ACCIDENT">Accident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
                {filteredHazards.map((hazard, idx) => (
                  <motion.button
                    key={hazard.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn(
                      'w-full text-left p-2.5 rounded-lg transition-colors',
                      selectedHazard?.id === hazard.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedHazard(selectedHazard?.id === hazard.id ? null : hazard)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full', severityDot[hazard.severity])} />
                        <span className="text-xs font-medium capitalize">{hazard.type.replace(/_/g, ' ').toLowerCase()}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatRelativeTime(hazard.reportedAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{hazard.description}</p>
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHazard && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4"
          >
            <Card className="bg-background/90 backdrop-blur-xl border-border/50 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg', severityColor[selectedHazard.severity])}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold capitalize">{selectedHazard.type.replace(/_/g, ' ').toLowerCase()}</h3>
                        <Badge
                          variant={
                            selectedHazard.severity === 'CRITICAL' ? 'critical' :
                            selectedHazard.severity === 'HIGH' ? 'high' :
                            selectedHazard.severity === 'MEDIUM' ? 'medium' : 'low'
                          }
                        >
                          {selectedHazard.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{selectedHazard.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedHazard.latitude.toFixed(4)}, {selectedHazard.longitude.toFixed(4)} · Reported {formatRelativeTime(selectedHazard.reportedAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedHazard(null)}
                    className="rounded-full p-1 hover:bg-accent transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-6 rounded-r-xl bg-background/80 backdrop-blur-xl border border-l-0 border-border/50 flex items-center justify-center hover:bg-accent transition-colors shadow-lg"
      >
        <ChevronRight className={cn('h-4 w-4 transition-transform', sidebarOpen && 'rotate-180')} />
      </button>
    </div>
  );
}

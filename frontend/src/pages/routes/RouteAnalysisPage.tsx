import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Route,
  Search,
  AlertTriangle,
  Shield,
  Clock,
  Navigation,
  ChevronRight,
  ChevronLeft,
  Loader2,
  MapPin,
  Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RiskIndicator } from '@/components/ui/risk-indicator';
import { PageContainer } from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import RouteMap from '@/components/map/RouteMap';
import { geocode, getRoute, geocodeSuggestions } from '@/lib/routing';

interface RouteResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  totalDistance: number;
  estimatedDuration: number;
  safeRoute: boolean;
  warnings: string[];
  hazards: { type: string; severity: string; distance: number; description: string }[];
  alternatives: { riskScore: number; distance: number; duration: number }[];
}

const mockResult: RouteResult = {
  riskScore: 34,
  riskLevel: 'MODERATE',
  totalDistance: 15.7,
  estimatedDuration: 42,
  safeRoute: true,
  warnings: [
    'Construction on 5th Ave - expect delays',
    'Flooding reported on River Road',
  ],
  hazards: [
    { type: 'Pothole', severity: 'HIGH', distance: 2.3, description: 'Large pothole on right lane' },
    { type: 'Construction', severity: 'MEDIUM', distance: 5.1, description: 'Road work in progress' },
    { type: 'Debris', severity: 'LOW', distance: 8.7, description: 'Scattered debris on shoulder' },
  ],
  alternatives: [
    { riskScore: 18, distance: 18.2, duration: 52 },
    { riskScore: 52, distance: 12.1, duration: 35 },
    { riskScore: 28, distance: 16.5, duration: 45 },
  ],
};

const addisSubCities = [
  'Addis Ketema', 'Akaki Kality', 'Arada', 'Bole',
  'Gullele', 'Kirkos', 'Kolfe Keranio', 'Lemi Kura',
  'Lideta', 'Nifas Silk-Lafto', 'Yeka',
];

const addisNeighbors = [
  'Sebeta', 'Sululta', 'Sendafa', 'Dukem',
  'Bishoftu', 'Burayu', 'Lega Tafo', 'Holeta',
  'Alem Gena', 'Gelan', 'Goro', 'Teji',
];

const addisLandmarks = [
  'Bole International Airport', 'Meskel Square', 'Piassa',
  'Megenagna', 'Ayat', 'CMC', 'Kazanchis', 'Saris',
  'Mexico Square', 'Shiro Meda', 'Merkato', '4 Kilo',
  '6 Kilo', 'Bambis', 'Gotera', 'La Gare',
  'Bole Atlas', 'Bole Michael', 'Summit', 'Kotebe',
  'Bole Arabssa', 'Bole Bulbula', 'Bole Medhanialem',
  'Gerji', 'Gofa', 'Jemo', 'Kality',
  'Karaalo', 'Kera', 'Lebu', 'Mekanisa',
  'Old Airport', 'Ras Desta Damtew', 'Senga Tera',
  'Tor Hailoch', 'Urael', 'Wello Sefer',
  'Zequala',
];

const allLocations = [...addisSubCities, ...addisLandmarks, ...addisNeighbors];

const historyData = [
  { id: '1', start: 'Bole', dest: 'Kirkos', riskScore: 23, date: 'Today, 9:15 AM' },
  { id: '2', start: 'Piassa', dest: 'Megenagna', riskScore: 12, date: 'Today, 8:30 AM' },
  { id: '3', start: 'Bole Airport', dest: 'Mexico Square', riskScore: 18, date: 'Today, 7:45 AM' },
  { id: '4', start: 'Merkato', dest: 'Kazanchis', riskScore: 30, date: 'Yesterday' },
  { id: '5', start: 'Ayat', dest: 'CMC', riskScore: 8, date: 'Yesterday' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function RouteAnalysisPage() {
  const [start, setStart] = React.useState('');
  const [dest, setDest] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<RouteResult | null>(null);
  const [showResult, setShowResult] = React.useState(false);
  const [coords, setCoords] = React.useState({ startLat: 9.03, startLng: 38.74, endLat: 9.02, endLng: 38.75 });
  const [routePoints, setRoutePoints] = React.useState<[number, number][]>([]);
  const [altRoutes, setAltRoutes] = React.useState<{ points: [number, number][]; distance: number; duration: number }[]>([]);
  const navigate = useNavigate();
  const [routeError, setRouteError] = React.useState('');
  const [hazardPositions, setHazardPositions] = React.useState<{ lat: number; lng: number; type: string; severity: string }[]>([]);
  const [startSuggestions, setStartSuggestions] = React.useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = React.useState<string[]>([]);
  const [focusedField, setFocusedField] = React.useState<'start' | 'dest' | null>(null);

  React.useEffect(() => {
    if (focusedField === 'start' && start.length > 0) {
      setStartSuggestions(allLocations.filter(l => l.toLowerCase().includes(start.toLowerCase())).slice(0, 5));
    } else { setStartSuggestions([]); }
  }, [start, focusedField]);

  React.useEffect(() => {
    if (focusedField === 'dest' && dest.length > 0) {
      setDestSuggestions(allLocations.filter(l => l.toLowerCase().includes(dest.toLowerCase())).slice(0, 5));
    } else { setDestSuggestions([]); }
  }, [dest, focusedField]);

  const handleAnalyze = async () => {
    if (!start || !dest) return;
    setLoading(true);
    setShowResult(false);
    setRouteError('');
    setRoutePoints([]);
    setAltRoutes([]);
    setHazardPositions([]);

    try {
      const from = await geocode(start);
      if (!from) { setRouteError(`Could not find location: "${start}"`); setLoading(false); return; }
      const to = await geocode(dest);
      if (!to) { setRouteError(`Could not find location: "${dest}"`); setLoading(false); return; }

      setCoords({ startLat: from.lat, startLng: from.lng, endLat: to.lat, endLng: to.lng });

      const routeData = await getRoute(from, to);
      if (!routeData) { setRouteError('Could not calculate route between these locations'); setLoading(false); return; }

      setRoutePoints(routeData.main.points);
      setAltRoutes(routeData.alternatives);
      const hazPos = mockResult.hazards.map((h) => {
        const idx = Math.floor((routeData.main.points.length - 1) * (0.2 + Math.random() * 0.6));
        const p = routeData.main.points[Math.min(idx, routeData.main.points.length - 1)] || routeData.main.points[0];
        return { lat: p[0], lng: p[1], type: h.type, severity: h.severity };
      });
      setHazardPositions(hazPos);
      setResult({
        ...mockResult,
        totalDistance: routeData.main.distance,
        estimatedDuration: routeData.main.duration,
        alternatives: routeData.alternatives.map((a) => ({
          riskScore: Math.round(20 + Math.random() * 40),
          distance: a.distance,
          duration: a.duration,
        })),
      });
      setLoading(false);
      setShowResult(true);
    } catch (err: any) {
      setRouteError(err?.message || 'Analysis failed. Check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Route Analysis"
      description="Analyze road safety between two locations"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Route Safety Check</CardTitle>
              <CardDescription>Enter your start and destination to analyze the route</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="start">Starting Point</Label>
                  <Input
                    id="start"
                    placeholder="e.g. Bole, Piassa, Mexico Square..."
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    onFocus={() => setFocusedField('start')}
                    onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                    leftIcon={<MapPin className="h-4 w-4" />}
                  />
                  {startSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
                      {startSuggestions.map((s) => (
                        <button key={s} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                          onMouseDown={() => { setStart(s); setStartSuggestions([]); }}
                        >{s}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="dest">Destination</Label>
                  <Input
                    id="dest"
                    placeholder="e.g. Bole, Piassa, Mexico Square..."
                    value={dest}
                    onChange={(e) => setDest(e.target.value)}
                    onFocus={() => setFocusedField('dest')}
                    onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                    leftIcon={<Navigation className="h-4 w-4" />}
                  />
                  {destSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
                      {destSuggestions.map((s) => (
                        <button key={s} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                          onMouseDown={() => { setDest(s); setDestSuggestions([]); }}
                        >{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {addisSubCities.map((sc) => (
                  <button key={sc}
                    className="px-2.5 py-1 text-[11px] rounded-full border border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { if (!start || dest) { setStart(sc); } else { setDest(sc); } }}
                  >{sc}</button>
                ))}
                <span className="text-[10px] text-muted-foreground self-center mx-0.5">|</span>
                {addisNeighbors.map((sc) => (
                  <button key={sc}
                    className="px-2.5 py-1 text-[11px] rounded-full border border-dashed border-border bg-muted/10 hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { if (!start || dest) { setStart(sc); } else { setDest(sc); } }}
                  >{sc}</button>
                ))}
              </div>
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleAnalyze}
                disabled={!start || !dest || loading}
                loading={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Route...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Analyze Route
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {routeError && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600">
              {routeError}
            </motion.div>
          )}

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center py-16"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto"
                  >
                    <Route className="h-8 w-8 text-primary" />
                  </motion.div>
                  <p className="text-lg font-medium">Analyzing route safety</p>
                  <p className="text-sm text-muted-foreground">Geocoding locations & fetching route...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showResult && result && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="space-y-6"
              >
                <Card glass>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                      <RiskIndicator score={result.riskScore} size="lg" />
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {result.safeRoute ? 'Route is Safe' : 'Route has Risks'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {result.totalDistance.toFixed(1)} km · ~{result.estimatedDuration} min
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Navigation className="h-4 w-4 text-muted-foreground" />
                            <span>{result.totalDistance.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>~{result.estimatedDuration} min</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            <span>{result.hazards.length} hazards</span>
                          </div>
                        </div>
                        {result.warnings.length > 0 && (
                          <div className="space-y-1">
                            {result.warnings.map((w, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-amber-500">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{w}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card glass>
                  <CardHeader>
                    <CardTitle className="text-lg">Hazard Warnings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.hazards.map((hazard, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2 rounded-lg',
                            hazard.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                            hazard.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-emerald-500/10 text-emerald-500'
                          )}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{hazard.type}</p>
                            <p className="text-xs text-muted-foreground">{hazard.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{hazard.distance} km</span>
                          <Badge
                            variant={hazard.severity === 'HIGH' ? 'high' : hazard.severity === 'MEDIUM' ? 'medium' : 'low'}
                          >
                            {hazard.severity}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                <Card glass>
                  <CardHeader>
                    <CardTitle className="text-lg">Alternative Routes</CardTitle>
                    <CardDescription>Compare safety and efficiency</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Route className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Current Route</p>
                          <p className="text-xs text-muted-foreground">Recommended</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{result.totalDistance.toFixed(1)} km</span>
                        <span className="text-xs text-muted-foreground">~{result.estimatedDuration} min</span>
                        <Badge variant={result.riskScore <= 25 ? 'low' : 'medium'}>{result.riskScore}</Badge>
                      </div>
                    </motion.div>
                    {result.alternatives.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No alternative routes found</p>
                    )}
                    {result.alternatives.map((alt, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (idx + 1) * 0.08 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          const clicked = altRoutes[idx];
                          if (!clicked) return;
                          setRoutePoints(clicked.points);
                          setResult(prev => prev ? { ...prev, totalDistance: clicked.distance, estimatedDuration: clicked.duration } : prev);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2 rounded-lg',
                            alt.riskScore <= 25 ? 'bg-emerald-500/10 text-emerald-500' :
                            alt.riskScore <= 50 ? 'bg-amber-500/10 text-amber-500' :
                            'bg-orange-500/10 text-orange-500'
                          )}>
                            <Route className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Alternative {idx + 1}</p>
                            <p className="text-xs text-muted-foreground">Click to view</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">{alt.distance.toFixed(1)} km</span>
                          <span className="text-xs text-muted-foreground">~{alt.duration} min</span>
                          <Badge variant={alt.riskScore <= 25 ? 'low' : alt.riskScore <= 50 ? 'medium' : 'high'}>
                            {alt.riskScore}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                <Card glass>
                  <CardHeader>
                    <CardTitle className="text-lg">Route Map</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <RouteMap
                      startLat={coords.startLat}
                      startLng={coords.startLng}
                      endLat={coords.endLat}
                      endLng={coords.endLng}
                      startName={start}
                      endName={dest}
                      routePoints={routePoints}
                      altRoutes={altRoutes}
                      hazardMarkers={hazardPositions}
                      onMyLocation={async (lat, lng) => {
                        setCoords((prev) => ({ ...prev, startLat: lat, startLng: lng }));
                        try {
                          const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&countrycodes=et&accept-language=en`,
                            { headers: { 'Accept-Language': 'en' } }
                          );
                          const data = await res.json();
                          setStart(data?.display_name?.split(',')[0] || `My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                        } catch {
                          setStart(`My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                        }
                      }}
                    />
                  </CardContent>
                </Card>

                <Button size="lg" className="w-full gap-2" onClick={() => {
                  navigate('/trips/active', {
                    state: {
                      startName: start,
                      destName: dest,
                      startLat: coords.startLat,
                      startLng: coords.startLng,
                      endLat: coords.endLat,
                      endLng: coords.endLng,
                      routePoints,
                      altRoutes,
                      totalDistance: result.totalDistance,
                      estimatedDuration: result.estimatedDuration,
                      riskScore: result.riskScore,
                    }
                  });
                }}>
                  <Navigation className="h-4 w-4" />
                  Start Trip
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Analyses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {historyData.map((item, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  onClick={() => { setStart(item.start); setDest(item.dest); }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={item.riskScore <= 25 ? 'low' : 'medium'}>{item.riskScore}</Badge>
                    <span className="text-[10px] text-muted-foreground">{item.date}</span>
                  </div>
                  <p className="text-xs font-medium truncate">{item.start} → {item.dest}</p>
                </motion.button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

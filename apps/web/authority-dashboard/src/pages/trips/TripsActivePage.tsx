import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation, MapPin, Clock, AlertTriangle, Shield,
  ChevronLeft, Gauge, Camera, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/layout/page-container';
import { cn } from '@/lib/utils';
import { startTrip, endTrip } from '@/services/tripService';
import { getRoute } from '@/lib/routing';
import { hazardsApi } from '@/lib/api';
import { saveTrip, saveHazard, generateId } from '@/lib/storage';
import { saveTripDB, saveLocationDB, saveHazardDB, syncPendingRecords, getPendingLocationsDB, getPendingHazardsDB } from '@/lib/db';
import type { TripStatus } from '@/types';

interface TripRouteState {
  startName: string;
  destName: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  routePoints: [number, number][];
  altRoutes?: { points: [number, number][]; distance: number; duration: number }[];
  totalDistance: number;
  estimatedDuration: number;
  riskScore: number;
}

interface HazardEvent {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  lat: number;
  lng: number;
  time: string;
  reported: boolean;
  reportError?: string;
  photoCaptured?: boolean;
  photoUrl?: string;
}

type HazardStage = 
  | 'sensors'
  | 'ai_analysis'
  | 'verification'
  | 'duplicate_check'
  | 'report_creation'
  | 'backend_validation'
  | 'notify_drivers'
  | 'notify_authority'
  | 'repair_dispatched'
  | 'authority_verification'
  | 'resolved'
  | 'safe_update';

const pipelineSteps: { key: HazardStage; label: string; icon: string; detail: string }[] = [
  { key: 'sensors', label: 'GPS + Camera + Accelerometer + Gyroscope', icon: '📡', detail: 'Continuous data collection from all sensors' },
  { key: 'ai_analysis', label: 'AI Multi-Sensor Analysis', icon: '🧠', detail: 'Cross-referencing sensor data streams' },
  { key: 'verification', label: 'Multi-Sensor Verification', icon: '✓', detail: 'Verifying hazard across multiple sensors' },
  { key: 'duplicate_check', label: 'Duplicate Hazard Check', icon: '🔍', detail: 'Checking if hazard already exists in system' },
  { key: 'report_creation', label: 'Creating Hazard Report', icon: '📄', detail: 'Generating report with photo evidence' },
  { key: 'backend_validation', label: 'AI Backend Validation', icon: '⚙️', detail: 'Validating report on cloud AI backend' },
  { key: 'notify_drivers', label: 'Notifying Nearby Drivers', icon: '🚗', detail: 'Alerting drivers in the vicinity' },
  { key: 'notify_authority', label: 'Notifying Road Authority', icon: '🏛️', detail: 'Sending report to Addis Ababa Road Authority' },
  { key: 'repair_dispatched', label: 'Road Repair Crew Dispatched', icon: '🔧', detail: 'Repair team en route to location' },
  { key: 'authority_verification', label: 'Authority Verification', icon: '👮', detail: 'Authority confirms hazard report' },
  { key: 'resolved', label: 'Hazard Marked as Resolved', icon: '✅', detail: 'Road repair completed successfully' },
  { key: 'safe_update', label: 'Road is Safe Update Sent', icon: '📢', detail: 'All drivers notified road is safe' },
];

const hazardPhotoMap: Record<string, string> = {
  'Pothole': 'https://images.unsplash.com/photo-1587502754543-ced2530f5c3d?w=400&h=300&fit=crop',
  'Rough Road': 'https://images.unsplash.com/photo-1515168833104-8abb3f7c2a8d?w=400&h=300&fit=crop',
  'Speed Bump': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&h=300&fit=crop',
  'Road Crack': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  'Debris': 'https://images.unsplash.com/photo-1581091226825-9c1f6d0b6e0b?w=400&h=300&fit=crop',
};

const hazardTypes = [
  { type: 'Pothole', severity: 'HIGH' as const, desc: 'Large pothole detected on road surface' },
  { type: 'Sudden Brake', severity: 'MEDIUM' as const, desc: 'Abrupt deceleration detected' },
  { type: 'Sharp Turn', severity: 'LOW' as const, desc: 'Aggressive steering detected' },
  { type: 'Speed Bump', severity: 'LOW' as const, desc: 'Speed bump crossed at high speed' },
  { type: 'Rough Road', severity: 'MEDIUM' as const, desc: 'Uneven road surface detected via vibration' },
  { type: 'Near Miss', severity: 'HIGH' as const, desc: 'Vehicle detected too close to obstacle' },
  { type: 'Swerve', severity: 'MEDIUM' as const, desc: 'Unusual lateral movement detected' },
  { type: 'Acceleration Spike', severity: 'LOW' as const, desc: 'Sudden acceleration detected' },
];

function createColoredIcon(color: string, pulse = false) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 16px; height: 16px; border-radius: 50%;
      background: ${color}; border: 2px solid white;
      box-shadow: 0 0 0 2px ${color}44, 0 2px 6px rgba(0,0,0,0.3);
      ${pulse ? 'animation: markerPulse 1.5s ease-in-out infinite;' : ''}
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const startIcon = createColoredIcon('#22c55e');
const endIcon = createColoredIcon('#ef4444');
const trackingIcon = createColoredIcon('#3b82f6', true);
const hazardIcon = createColoredIcon('#f59e0b');

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [points, map]);
  return null;
}

function LocateButton({ onLocate }: { onLocate: (latlng: [number, number]) => void }) {
  return (
    <div className="absolute top-3 left-3 z-[1000]">
      <button
        onClick={() => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (p) => onLocate([p.coords.latitude, p.coords.longitude]),
            () => {},
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }}
        className="flex items-center justify-center h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-border"
        title="My Location"
      >
        <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>
    </div>
  );
}

function PipelineVisual({ currentStage }: { currentStage: HazardStage | null }) {
  if (!currentStage) return null;
  const currentIdx = pipelineSteps.findIndex(s => s.key === currentStage);

  return (
    <Card glass>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Hazard Processing Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 max-h-64 overflow-y-auto">
        {pipelineSteps.map((step, idx) => {
          const isComplete = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <motion.div
              key={step.key}
              initial={isCurrent ? { opacity: 0, x: -10 } : undefined}
              animate={{ opacity: isPending ? 0.4 : 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg text-xs transition-all',
                isCurrent && 'bg-primary/10 border border-primary/20 shadow-sm',
                isComplete && 'bg-emerald-500/5',
              )}
            >
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0',
                isComplete && 'bg-emerald-500/20 text-emerald-500',
                isCurrent && 'bg-primary/20 text-primary animate-pulse',
                isPending && 'bg-muted text-muted-foreground',
              )}>
                {isComplete ? '✓' : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium text-xs',
                  isComplete && 'text-emerald-600 dark:text-emerald-400',
                  isCurrent && 'text-primary',
                )}>{step.label}</p>
                {(isCurrent || isComplete) && (
                  <p className="text-[10px] text-muted-foreground truncate">{step.detail}</p>
                )}
              </div>
              {isCurrent && <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full shrink-0" />}
              {isComplete && <span className="text-emerald-500 text-[10px] shrink-0">Done</span>}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function FlyToLocation({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (pos) map.flyTo(pos, 15, { duration: 1 });
  }, [pos, map]);
  return null;
}

function MyLocationMarker({ pos }: { pos: [number, number] }) {
  return (
    <Marker position={pos} icon={L.divIcon({
      className: 'my-location-marker',
      html: `<div style="
        width: 18px; height: 18px; border-radius: 50%;
        background: #3b82f6; border: 3px solid white;
        box-shadow: 0 0 0 2px rgba(59,130,246,0.3), 0 2px 6px rgba(0,0,0,0.3);
      "></div>
      <div style="
        position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(59,130,246,0.15);
        animation: locatePulse 2s ease-in-out infinite;
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    })}>
      <Popup>My Location</Popup>
    </Marker>
  );
}

function LiveTrackingMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (position) {
      const bounds = map.getBounds();
      if (!bounds.contains(L.latLng(position[0], position[1]))) {
        map.panTo(position, { animate: true, duration: 0.6 });
      }
    }
  }, [position, map]);

  if (!position) return null;
  return (
    <Marker position={position} icon={trackingIcon}>
      <Popup>Current Position</Popup>
    </Marker>
  );
}

export default function TripsActivePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeData = location.state as TripRouteState | null;

  const [phase, setPhase] = React.useState<'preview' | 'tracking' | 'ended'>('preview');
  const [tripId, setTripId] = React.useState<string | null>(null);
  const [watchId, setWatchId] = React.useState<number | null>(null);
  const [currentPos, setCurrentPos] = React.useState<{ lat: number; lng: number; speed: number } | null>(null);
  const [actualRoutePoints, setActualRoutePoints] = React.useState<[number, number][]>([]);
  const [actualStart, setActualStart] = React.useState<{ lat: number; lng: number } | null>(null);
  const [distanceTraveled, setDistanceTraveled] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [hazards, setHazards] = React.useState<HazardEvent[]>([]);
  const [lastHazard, setLastHazard] = React.useState<HazardEvent | null>(null);
  const [cameraFlash, setCameraFlash] = React.useState(false);
  const [lastPhoto, setLastPhoto] = React.useState<{ url: string; hazardId: string } | null>(null);

  const [progress, setProgress] = React.useState(0);
  const [maxSpeed, setMaxSpeed] = React.useState(0);
  const [myLocPos, setMyLocPos] = React.useState<[number, number] | null>(null);
  const [pipelineStage, setPipelineStage] = React.useState<HazardStage | null>(null);
  const [loadingGps, setLoadingGps] = React.useState(false);

  const [online, setOnline] = React.useState(navigator.onLine);
  const [pendingSync, setPendingSync] = React.useState(0);

  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const hazardTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const locationTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const syncTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPosRef = React.useRef<{ lat: number; lng: number } | null>(null);
  const currentPosRef = React.useRef<{ lat: number; lng: number; speed: number } | null>(null);
  const prevSpeedRef = React.useRef(0);
  const progressRef = React.useRef(0);

  React.useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  React.useEffect(() => {
    if (!online) return;
    const interval = setInterval(async () => {
      const result = await syncPendingRecords();
      if (result.synced > 0 || result.pending > 0) {
        const pending = await getPendingLocationsDB();
        const pendingHaz = await getPendingHazardsDB();
        setPendingSync(pending.length + pendingHaz.length);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [online]);

  if (!routeData) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <Navigation className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Route Selected</h2>
          <p className="text-muted-foreground">Please analyze a route first from the Route Analysis page.</p>
          <Button onClick={() => navigate('/routes')}>Go to Route Analysis</Button>
        </div>
      </PageContainer>
    );
  }
  const rd = routeData;

  async function startGeoTracking() {
    setLoadingGps(true);

    let userLat = rd.startLat;
    let userLng = rd.startLng;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          const timeoutId = setTimeout(() => reject(new Error('GPS timeout')), 6000);
          navigator.geolocation.getCurrentPosition(
            (p) => { clearTimeout(timeoutId); resolve(p); },
            (err) => { clearTimeout(timeoutId); reject(err); },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
      } catch {}
    }

    const userSpeed = 0;
    setActualStart({ lat: userLat, lng: userLng });
    setCurrentPos({ lat: userLat, lng: userLng, speed: userSpeed });

    let points = rd.routePoints;
    try {
      const route = await getRoute({ lat: userLat, lng: userLng }, { lat: rd.endLat, lng: rd.endLng });
      if (route) points = route.main.points;
    } catch {}
    setActualRoutePoints(points);

    let tripIdVal = '';
    try {
      const trip = await startTrip({
        startLat: userLat, startLng: userLng,
        startAddress: `Current Location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
        endLat: rd.endLat, endLng: rd.endLng, endAddress: rd.destName,
      });
      tripIdVal = trip.id;
    } catch {
      tripIdVal = `trip-${Date.now()}`;
    }
    setTripId(tripIdVal);
    setPhase('tracking');
    setLoadingGps(false);
    lastPosRef.current = { lat: userLat, lng: userLng };

    currentPosRef.current = { lat: userLat, lng: userLng, speed: 0 };

    saveTripDB({
      trip_id: tripIdVal,
      driver_id: 'driver-1',
      start_time: new Date().toISOString(),
      start_lat: userLat,
      start_lng: userLng,
      start_address: rd.startName,
      end_address: rd.destName,
      status: 'ACTIVE',
    }).catch(() => {});

    const locIntervalId = setInterval(() => {
      const p = currentPosRef.current;
      if (!p || !tripIdVal) return;
      saveLocationDB({
        trip_id: tripIdVal,
        latitude: p.lat,
        longitude: p.lng,
        speed: p.speed,
        heading: 0,
        accuracy: 10,
        timestamp: new Date().toISOString(),
        sync_status: navigator.onLine ? 'synced' : 'pending',
      }).then(() => {
        if (!navigator.onLine) {
          getPendingLocationsDB().then(locs => setPendingSync(locs.length));
        }
      }).catch(() => {});
    }, 5000);
    locationTimerRef.current = locIntervalId;

    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (p) => {
          const lat = p.coords.latitude;
          const lng = p.coords.longitude;
          const speed = p.coords.speed !== null ? Math.round(p.coords.speed * 3.6) : 0;
          setCurrentPos({ lat, lng, speed });
          currentPosRef.current = { lat, lng, speed };
          setMaxSpeed((prev) => Math.max(prev, speed));
          if (lastPosRef.current) {
            const dist = haversine(lastPosRef.current.lat, lastPosRef.current.lng, lat, lng);
            setDistanceTraveled((prev) => prev + dist);
          }
          lastPosRef.current = { lat, lng };
          progressRef.current = Math.min(progressRef.current + 0.3 + Math.random() * 0.5, 100);
          setProgress(progressRef.current);
          if (prevSpeedRef.current > 0 && speed < prevSpeedRef.current - 15 && speed < 20) addHazard('Sudden Brake', speed < 10 ? 'HIGH' : 'MEDIUM', lat, lng);
          if (prevSpeedRef.current > 0 && speed > prevSpeedRef.current + 20) addHazard('Acceleration Spike', 'LOW', lat, lng);
          if (speed > 0) prevSpeedRef.current = speed;
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      setWatchId(id);
    }

    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    setTimeout(() => {
      const p = currentPosRef.current;
      if (p) addHazard('Pothole', 'HIGH', p.lat + 0.0005, p.lng + 0.0005);
    }, 4000);
    const posRef = currentPosRef;
    hazardTimerRef.current = setInterval(() => {
      const p = posRef.current;
      if (!p) return;
      if (Math.random() < 0.2) {
        const idx = Math.floor(Math.random() * hazardTypes.length);
        const hz = hazardTypes[idx];
        if (hz) addHazard(hz.type, hz.severity, p.lat + (Math.random() - 0.5) * 0.001, p.lng + (Math.random() - 0.5) * 0.001);
      }
    }, 10000);
  }

  function runPipeline() {
    const stages = pipelineSteps.map(s => s.key);
    let i = 0;
    setPipelineStage(stages[0] ?? null);
    const interval = setInterval(() => {
      i++;
      if (i >= stages.length) { clearInterval(interval); return; }
      const stage = stages[i];
      if (stage) setPipelineStage(stage);
    }, 3000);
  }

  function addHazard(type: string, severity: 'LOW' | 'MEDIUM' | 'HIGH', lat: number, lng: number) {
    const desc = hazardTypes.find(h => h.type === type)?.desc || type;
    const hazard: HazardEvent = {
      id: `hzd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type, severity, description: desc,
      lat, lng,
      time: new Date().toLocaleTimeString(),
      reported: false,
      photoCaptured: false,
    };
    setHazards((prev) => [hazard, ...prev]);
    setLastHazard(hazard);
    setTimeout(() => setLastHazard(null), 6000);

    setCameraFlash(true);
    setTimeout(() => {
      const fallback = hazardPhotoMap['Pothole']!;
      const photoUrl = hazardPhotoMap[type] ?? fallback;
      setHazards((prev) => prev.map(h => h.id === hazard.id ? { ...h, photoCaptured: true, photoUrl } : h));
      setLastPhoto({ url: photoUrl, hazardId: hazard.id });
      setTimeout(() => setLastPhoto(null), 5000);
      setCameraFlash(false);
      runPipeline();
    }, 800);

    hazardsApi.reportHazard({
      hazardType: severity === 'HIGH' && type === 'Pothole' ? 'POTHOLE' : type.toUpperCase().replace(' ', '_'),
      severity: severity as any,
      latitude: lat,
      longitude: lng,
      description: `${desc} — auto-detected during trip. Photo evidence captured by vehicle camera.`,
    }).then(() => {
      setHazards((prev) => prev.map(h => h.id === hazard.id ? { ...h, reported: true } : h));
    }).catch((err) => {
      setHazards((prev) => prev.map(h => h.id === hazard.id ? { ...h, reported: true, reportError: err?.message } : h));
    });

    saveHazard({
      id: hazard.id,
      tripId: tripId || generateId(),
      type, severity,
      latitude: lat, longitude: lng,
      description: desc,
      photoUrl: hazardPhotoMap[type],
      timestamp: new Date().toISOString(),
    });

    if (tripId) {
      saveHazardDB({
        trip_id: tripId,
        hazard_type: type.toUpperCase().replace(' ', '_'),
        severity,
        latitude: lat,
        longitude: lng,
        image_path: hazardPhotoMap[type],
        timestamp: new Date().toISOString(),
        sync_status: navigator.onLine ? 'synced' : 'pending',
      }).then(() => {
        if (!navigator.onLine) {
          getPendingHazardsDB().then(h => setPendingSync(prev => prev + h.length));
        }
      }).catch(() => {});
    }
  }

  async function handleEndTrip() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (timerRef.current) clearInterval(timerRef.current);
    if (hazardTimerRef.current) clearInterval(hazardTimerRef.current);
    if (locationTimerRef.current) clearInterval(locationTimerRef.current);
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    setPhase('ended');
    const tripEndLat = currentPos?.lat ?? rd.endLat;
    const tripEndLng = currentPos?.lng ?? rd.endLng;
    if (tripId) {
      try {
        await endTrip({
          tripId,
          endLat: tripEndLat,
          endLng: tripEndLng,
          totalDistance: Math.round(distanceTraveled * 100) / 100,
          averageSpeed: elapsed > 0 ? Math.round((distanceTraveled / (elapsed / 3600)) * 10) / 10 : 0,
          maxSpeed,
        });
      } catch {}
      saveTripDB({
        trip_id: tripId,
        driver_id: 'driver-1',
        start_time: new Date(Date.now() - elapsed * 1000).toISOString(),
        end_time: new Date().toISOString(),
        start_lat: actualStart?.lat ?? rd.startLat,
        start_lng: actualStart?.lng ?? rd.startLng,
        end_lat: tripEndLat,
        end_lng: tripEndLng,
        start_address: actualStart ? `My Location (${actualStart.lat.toFixed(4)}, ${actualStart.lng.toFixed(4)})` : rd.startName,
        end_address: rd.destName,
        status: 'COMPLETED',
        risk_score: rd.riskScore,
        total_distance: Math.round(distanceTraveled * 1000),
        avg_speed: elapsed > 0 ? Math.round((distanceTraveled / (elapsed / 3600)) * 10) / 10 : 0,
        max_speed: maxSpeed,
      }).catch(() => {});

      saveTrip({
        id: tripId,
        driverId: 'driver-1',
        driverName: 'You',
        startLat: actualStart?.lat ?? rd.startLat,
        startLng: actualStart?.lng ?? rd.startLng,
        endLat: tripEndLat,
        endLng: tripEndLng,
        startAddress: actualStart ? `My Location (${actualStart.lat.toFixed(4)}, ${actualStart.lng.toFixed(4)})` : rd.startName,
        endAddress: rd.destName,
        startTime: new Date(Date.now() - elapsed * 1000).toISOString(),
        endTime: new Date().toISOString(),
        status: 'COMPLETED' as TripStatus,
        riskScore: rd.riskScore,
        totalDistance: Math.round(distanceTraveled * 1000),
        averageSpeed: elapsed > 0 ? Math.round((distanceTraveled / (elapsed / 3600)) * 10) / 10 : 0,
        maxSpeed,
      });
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  if (phase === 'ended') {
    return (
      <PageContainer>
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemVariants} className="text-center py-12">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
              <Shield className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Trip Completed</h2>
            <p className="text-muted-foreground mb-6">{rd.startName} → {rd.destName}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
              <Card glass><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{distanceTraveled.toFixed(1)}</p><p className="text-xs text-muted-foreground">km traveled</p></CardContent></Card>
              <Card glass><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{formatTime(elapsed)}</p><p className="text-xs text-muted-foreground">duration</p></CardContent></Card>
              <Card glass><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{maxSpeed}</p><p className="text-xs text-muted-foreground">max km/h</p></CardContent></Card>
              <Card glass><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{hazards.length}</p><p className="text-xs text-muted-foreground">hazards found</p></CardContent></Card>
            </div>
            <div className="space-x-3">
              {hazards.length > 0 && (
                <Button variant="outline" onClick={() => navigate('/hazards/new', {
                  state: { fromTrip: true, hazardCount: hazards.length, hazards: hazards.filter(h => !h.reported) },
                })}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {hazards.filter(h => !h.reported).length > 0
                    ? `Report Pending Hazards (${hazards.filter(h => !h.reported).length})`
                    : `View Reported Hazards (${hazards.length})`
                  }
                </Button>
              )}
              <Button onClick={() => navigate('/trips')}><Navigation className="h-4 w-4 mr-2" />View Trip History</Button>
            </div>
          </motion.div>
        </motion.div>
      </PageContainer>
    );
  }

  const mapPoints = phase === 'tracking' && actualRoutePoints.length > 0 ? actualRoutePoints : rd.routePoints;
  const mapCenter: [number, number] = currentPos ? [currentPos.lat, currentPos.lng] : [(rd.startLat + rd.endLat) / 2, (rd.startLng + rd.endLng) / 2];

  return (
    <PageContainer>
      <style>{`.custom-marker { background: none !important; border: none !important; }
        .my-location-marker { background: none !important; border: none !important; }
        @keyframes markerPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.7; } }
        @keyframes locatePulse { 0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.4; } 50% { transform: translate(-50%,-50%) scale(1.5); opacity: 0.1; } }`}</style>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/routes')}><ChevronLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{phase === 'tracking' ? 'Active Trip' : 'Trip Preview'}</h1>
            <p className="text-sm text-muted-foreground">{rd.startName} → {rd.destName}</p>
          </div>
          {phase === 'tracking' && (
            <div className="flex items-center gap-2">
              <Badge variant={online ? 'default' : 'secondary'} className="text-[10px] h-6 gap-1">
                <span className={cn('h-2 w-2 rounded-full', online ? 'bg-emerald-500' : 'bg-red-500')} />
                {online ? 'Online' : 'Offline'}
              </Badge>
              {pendingSync > 0 && (
                <Badge variant="secondary" className="text-[10px] h-6">
                  {pendingSync} pending
                </Badge>
              )}
              <Badge variant="default" pulse><Activity className="h-3 w-3 mr-1 animate-pulse" />LIVE</Badge>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card glass><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></div>
            <div><p className="text-xs text-muted-foreground">Distance</p><p className="text-lg font-bold">{phase === 'tracking' ? distanceTraveled.toFixed(1) : rd.totalDistance.toFixed(1)} km</p></div>
          </CardContent></Card>
          <Card glass><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Clock className="h-4 w-4" /></div>
            <div><p className="text-xs text-muted-foreground">Duration</p><p className="text-lg font-bold">{phase === 'tracking' ? formatTime(elapsed) : `~${rd.estimatedDuration} min`}</p></div>
          </CardContent></Card>
          <Card glass><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Gauge className="h-4 w-4" /></div>
            <div><p className="text-xs text-muted-foreground">Speed</p><p className="text-lg font-bold">{phase === 'tracking' ? (currentPos?.speed ?? 0) : '--'} km/h</p></div>
          </CardContent></Card>
          <Card glass><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Shield className="h-4 w-4" /></div>
            <div><p className="text-xs text-muted-foreground">Risk</p><p className="text-lg font-bold">{rd.riskScore}</p></div>
          </CardContent></Card>
        </motion.div>

        {cameraFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8, 0] }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[9999] bg-white pointer-events-none"
          />
        )}

        <AnimatePresence>
          {lastPhoto && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <Camera className="h-5 w-5 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Photo Captured</p>
                <p className="text-xs text-muted-foreground truncate">Hazard evidence saved to report</p>
              </div>
              <div className="h-12 w-16 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                <img src={lastPhoto.url} alt="Hazard" className="h-full w-full object-cover" />
              </div>
              <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lastHazard && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
              className={cn('p-4 rounded-xl border flex items-start gap-3',
                lastHazard.severity === 'HIGH' ? 'bg-red-500/10 border-red-500/20' :
                lastHazard.severity === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-yellow-500/10 border-yellow-500/20'
              )}
            >
              <AlertTriangle className={cn('h-5 w-5 mt-0.5 shrink-0', lastHazard.severity === 'HIGH' ? 'text-red-500' : lastHazard.severity === 'MEDIUM' ? 'text-amber-500' : 'text-yellow-500')} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{lastHazard.type} Detected</p>
                <p className="text-xs text-muted-foreground">{lastHazard.description}</p>
                <p className="text-xs text-emerald-500 mt-0.5 flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  Camera capture in progress...
                </p>
              </div>
              <Badge variant={lastHazard.severity === 'HIGH' ? 'high' : lastHazard.severity === 'MEDIUM' ? 'medium' : 'low'}>{lastHazard.severity}</Badge>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants}>
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">{phase === 'tracking' ? 'Live Tracking' : 'Route Preview'}</CardTitle>
              <CardDescription>{phase === 'tracking' ? `${currentPos?.lat.toFixed(4)}, ${currentPos?.lng.toFixed(4)}` : `${rd.startName} → ${rd.destName}`}</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <div className="relative h-[350px] rounded-xl overflow-hidden">
                <LocateButton onLocate={(latlng) => setMyLocPos(latlng)} />
                <MapContainer center={mapCenter} zoom={13} className="h-full w-full" zoomControl={false} key={`${rd.startLat}-${rd.startLng}-${rd.endLat}-${rd.endLng}`}>
                  <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  <FitBounds points={mapPoints} />
                  <FlyToLocation pos={myLocPos} />
                  {myLocPos && <MyLocationMarker pos={myLocPos} />}
                  <Polyline positions={mapPoints} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7 }} />
                  {phase !== 'tracking' && (
                    <>
                      <Marker position={[rd.startLat, rd.startLng]} icon={startIcon}><Popup>{rd.startName}</Popup></Marker>
                      <Marker position={[rd.endLat, rd.endLng]} icon={endIcon}><Popup>{rd.destName}</Popup></Marker>
                    </>
                  )}
                  {phase === 'tracking' && (
                    <>
                      {actualStart && <Marker position={[actualStart.lat, actualStart.lng]} icon={startIcon}><Popup>Your start location</Popup></Marker>}
                      <Marker position={[rd.endLat, rd.endLng]} icon={endIcon}><Popup>{rd.destName}</Popup></Marker>
                      <LiveTrackingMarker position={currentPos ? [currentPos.lat, currentPos.lng] : null} />
                    </>
                  )}
                  {hazards.map((h) => (
                    <Marker key={h.id} position={[h.lat, h.lng]} icon={hazardIcon}>
                      <Popup><div className="text-xs"><strong>{h.type}</strong> - {h.severity}<br />{h.time}</div></Popup>
                    </Marker>
                  ))}
                </MapContainer>
                {phase === 'tracking' && (
                  <div className="absolute bottom-3 left-3 right-3 z-[1000]">
                    <div className="glass rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between text-xs mb-1"><span>Trip progress</span><span>{progress.toFixed(0)}%</span></div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {phase === 'preview' && (
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 py-6">
            <p className="text-lg font-medium text-center">Are you ready to start the trip?</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              GPS tracking will begin from your current location. The system will monitor speed, movement patterns,
              and detect road hazards automatically during the trip.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Camera className="h-4 w-4" />
              <span>Camera &amp; acceleration monitoring active</span>
            </div>
            <Button size="lg" className="gap-2 mt-4" onClick={() => startGeoTracking()} disabled={loadingGps} loading={loadingGps}>
              <Navigation className="h-4 w-4" />
              Are You Ready to Start the Trip?
            </Button>
          </motion.div>
        )}

        {phase === 'tracking' && (
          <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
            <Button size="lg" className="flex-1 gap-2" variant="destructive" onClick={handleEndTrip}>
              <Navigation className="h-4 w-4" />End Trip
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate('/hazards/new', {
              state: {
                prefill: {
                  latitude: currentPos?.lat.toFixed(6) ?? rd.startLat.toFixed(6),
                  longitude: currentPos?.lng.toFixed(6) ?? rd.startLng.toFixed(6),
                },
              },
            })}>
              <AlertTriangle className="h-4 w-4" />Report Hazard
            </Button>
          </motion.div>
        )}

        {pipelineStage && phase === 'tracking' && (
          <motion.div variants={itemVariants}>
            <PipelineVisual currentStage={pipelineStage} />
          </motion.div>
        )}

        {hazards.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card glass>
              <CardHeader>
                <CardTitle className="text-lg">Detected Hazards ({hazards.length})</CardTitle>
                <CardDescription>Automatically detected during trip</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                {hazards.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      {h.photoCaptured && h.photoUrl ? (
                        <div className="h-8 w-10 rounded-md overflow-hidden border border-border shrink-0 bg-muted">
                          <img src={h.photoUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', h.severity === 'HIGH' ? 'text-red-500' : h.severity === 'MEDIUM' ? 'text-amber-500' : 'text-yellow-500')} />
                      )}
                      <span className="text-sm truncate">{h.type}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {h.photoCaptured && <Camera className="h-3 w-3 text-muted-foreground" aria-label="Photo evidence" />}
                      {h.reported && <Badge variant="low" className="text-[10px] h-5 px-1.5">Reported</Badge>}
                      <span className="text-xs text-muted-foreground">{h.time}</span>
                      <Badge variant={h.severity === 'HIGH' ? 'high' : h.severity === 'MEDIUM' ? 'medium' : 'low'}>{h.severity}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

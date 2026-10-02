import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteMapProps {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startName?: string;
  endName?: string;
  routePoints: [number, number][];
  altRoutes?: { points: [number, number][]; distance: number; duration: number }[];
  hazardMarkers?: { lat: number; lng: number; type: string; severity: string }[];
  onMyLocation?: (lat: number, lng: number) => void;
}

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

const nearbyCities = [
  { name: 'Sebeta', lat: 8.9167, lng: 38.6167 },
  { name: 'Sululta', lat: 9.1833, lng: 38.7333 },
  { name: 'Sendafa', lat: 9.1500, lng: 38.9833 },
  { name: 'Dukem', lat: 8.8000, lng: 38.9167 },
  { name: 'Bishoftu', lat: 8.7511, lng: 38.9789 },
  { name: 'Burayu', lat: 9.0167, lng: 38.6667 },
  { name: 'Lega Tafo', lat: 9.0333, lng: 38.8167 },
  { name: 'Holeta', lat: 9.0500, lng: 38.5000 },
  { name: 'Alem Gena', lat: 8.8333, lng: 38.6000 },
  { name: 'Gelan', lat: 8.9333, lng: 38.7500 },
  { name: 'Goro', lat: 8.8500, lng: 38.8500 },
  { name: 'Teji', lat: 9.0000, lng: 38.4333 },
  { name: 'Debre Libanos', lat: 9.7000, lng: 38.8667 },
  { name: 'Chancho', lat: 9.3167, lng: 38.7500 },
  { name: 'Furi', lat: 8.8500, lng: 38.6500 },
  { name: 'Adulala', lat: 8.8167, lng: 38.9667 },
];

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

function NearbyLabels() {
  return (
    <>
      {nearbyCities.map((city) => (
        <Marker
          key={city.name}
          position={[city.lat, city.lng]}
          icon={L.divIcon({
            className: 'nearby-label',
            html: `<div style="
              font-size: 11px; font-weight: 600; color: #64748b;
              text-shadow: 0 1px 2px white, 0 -1px 2px white, 1px 0 2px white, -1px 0 2px white;
              white-space: nowrap; letter-spacing: 0.02em;
              background: rgba(255,255,255,0.7); padding: 1px 6px; border-radius: 8px;
              backdrop-filter: blur(2px); border: 1px solid rgba(0,0,0,0.06);
            ">${city.name}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          })}
          interactive={false}
        />
      ))}
    </>
  );
}

function FitBounds({ routePoints }: { routePoints: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (routePoints.length > 1 && !fitted.current) {
      const bounds = L.latLngBounds(routePoints.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      fitted.current = true;
    }
  }, [routePoints, map]);

  return null;
}

function AnimatedTracker({ routePoints }: { routePoints: [number, number][] }) {
  const [index, setIndex] = useState(0);
  const map = useMap();
  const indexRef = useRef(0);

  useEffect(() => {
    if (routePoints.length < 2) return;
    setIndex(0);
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= routePoints.length) {
        clearInterval(interval);
        return;
      }
      setIndex(indexRef.current);
    }, 800);
    return () => clearInterval(interval);
  }, [routePoints]);

  useEffect(() => {
    if (!routePoints[index]) return;
    const bounds = map.getBounds();
    const point = routePoints[index];
    if (!bounds.contains(L.latLng(point[0], point[1]))) {
      map.panTo(point, { animate: true, duration: 0.6 });
    }
  }, [index, map, routePoints]);

  if (routePoints.length < 2 || !routePoints[index]) return null;

  return (
    <Marker position={routePoints[index]} icon={trackingIcon}>
      <Popup>
        <div className="text-xs font-medium">
          Live Tracking<br />
          {routePoints[index][0].toFixed(4)}, {routePoints[index][1].toFixed(4)}
        </div>
      </Popup>
    </Marker>
  );
}

function FlyToLocation({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15, { duration: 1 });
  }, [pos, map]);
  return null;
}

export default function RouteMap({ startLat, startLng, endLat, endLng, startName, endName, routePoints, altRoutes, hazardMarkers, onMyLocation }: RouteMapProps) {
  const [myLocPos, setMyLocPos] = useState<[number, number] | null>(null);
  const center: [number, number] = useMemo(() => [(startLat + endLat) / 2, (startLng + endLng) / 2], [startLat, startLng, endLat, endLng]);
  const gmapsUrl = useMemo(() => {
    const origin = startName ? encodeURIComponent(`${startName}, Addis Ababa, Ethiopia`) : `${startLat},${startLng}`;
    const dest = endName ? encodeURIComponent(`${endName}, Addis Ababa, Ethiopia`) : `${endLat},${endLng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
  }, [startLat, startLng, endLat, endLng, startName, endName]);

  return (
    <div className="relative h-[400px] rounded-xl overflow-hidden" key={`${startLat}-${startLng}-${endLat}-${endLng}`}>
      <style>{`
        .custom-marker { background: none !important; border: none !important; }
        .my-location-marker { background: none !important; border: none !important; }
        @keyframes markerPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        @keyframes locatePulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%,-50%) scale(1.5); opacity: 0.1; }
        }
      `}</style>
      <LocateButton onLocate={(latlng) => { setMyLocPos(latlng); onMyLocation?.(latlng[0], latlng[1]); }} />
      <a
        href={gmapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 right-3 z-[1000] bg-white dark:bg-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#4285F4"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        Open in Google Maps
      </a>
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds routePoints={routePoints} />
        <FlyToLocation pos={myLocPos} />
        {myLocPos && <MyLocationMarker pos={myLocPos} />}
        <NearbyLabels />
        <Polyline
          positions={routePoints}
          pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7 }}
        />
        {altRoutes?.map((alt, i) => (
          <Polyline
            key={`alt-${i}`}
            positions={alt.points}
            pathOptions={{ color: '#94a3b8', weight: 2.5, opacity: 0.5, dashArray: '8 4' }}
          />
        ))}
        <Marker position={[startLat, startLng]} icon={startIcon}>
          <Popup>Start</Popup>
        </Marker>
        <Marker position={[endLat, endLng]} icon={endIcon}>
          <Popup>Destination</Popup>
        </Marker>
        {hazardMarkers?.map((h, i) => (
          <Marker key={i} position={[h.lat, h.lng]} icon={hazardIcon}>
            <Popup>
              <div className="text-xs"><strong>{h.type}</strong> - {h.severity}</div>
            </Popup>
          </Marker>
        ))}
        <AnimatedTracker routePoints={routePoints} />
      </MapContainer>
    </div>
  );
}

import { decodePolyline } from './polyline';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  points: [number, number][];
  distance: number;
  duration: number;
}

export interface RouteWithAlternatives {
  main: RouteResult;
  alternatives: RouteResult[];
}

export async function geocode(query: string): Promise<GeoPoint | null> {
  const res = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(query)},+Addis+Ababa,+Ethiopia&format=json&limit=3&countrycodes=et`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export async function getRoute(from: GeoPoint, to: GeoPoint): Promise<RouteWithAlternatives | null> {
  const res = await fetch(
    `${OSRM_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=polyline&alternatives=true&steps=true`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.routes?.length) return null;

  const routes = data.routes.map((r: any) => ({
    points: decodePolyline(r.geometry),
    distance: r.distance / 1000,
    duration: Math.round(r.duration / 60),
  }));

  return {
    main: routes[0],
    alternatives: routes.slice(1),
  };
}

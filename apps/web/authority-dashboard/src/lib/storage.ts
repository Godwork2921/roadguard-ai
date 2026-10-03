import type { Trip } from '@/types';

const TRIPS_KEY = 'roadguard_trips';
const HAZARDS_KEY = 'roadguard_hazards';

export interface SavedHazard {
  id: string;
  tripId: string;
  type: string;
  severity: string;
  latitude: number;
  longitude: number;
  description: string;
  photoUrl?: string;
  timestamp: string;
}

export function saveTrip(trip: Trip) {
  try {
    const trips = getTrips();
    trips.unshift(trip);
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips.slice(0, 100)));
  } catch {}
}

export function getTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveHazard(hazard: SavedHazard) {
  try {
    const hazards = getHazards();
    hazards.unshift(hazard);
    localStorage.setItem(HAZARDS_KEY, JSON.stringify(hazards.slice(0, 200)));
  } catch {}
}

export function getHazards(): SavedHazard[] {
  try {
    return JSON.parse(localStorage.getItem(HAZARDS_KEY) || '[]');
  } catch { return []; }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

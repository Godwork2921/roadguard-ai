import api from '@/lib/api';
import type { Trip, PaginationParams } from '@/types';

interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Record<string, unknown>;
}

interface StartTripData {
  startLat: number;
  startLng: number;
  startAddress?: string;
  endLat: number;
  endLng: number;
  endAddress?: string;
  vehicleId?: string;
}

interface EndTripData {
  tripId: string;
  endLat: number;
  endLng: number;
  endAddress?: string;
  totalDistance?: number;
  averageSpeed?: number;
  maxSpeed?: number;
}

export async function startTrip(data: StartTripData): Promise<Trip> {
  const { data: response } = await api.post<ApiResponseWrapper<Trip>>(
    '/trips/start',
    data
  );
  return response.data;
}

export async function endTrip(data: EndTripData): Promise<Trip> {
  const { data: response } = await api.post<ApiResponseWrapper<Trip>>(
    '/trips/end',
    data
  );
  return response.data;
}

export async function getActiveTrip(): Promise<Trip | null> {
  try {
    const { data: response } = await api.get<ApiResponseWrapper<Trip>>(
      '/trips/active'
    );
    return response.data;
  } catch {
    return null;
  }
}

export async function getTripHistory(
  params: PaginationParams = {}
): Promise<{ data: Trip[]; pagination: Record<string, unknown> }> {
  const { data: response } = await api.get<ApiResponseWrapper<Trip[]>>(
    '/trips/history',
    { params }
  );
  return { data: response.data, pagination: response.pagination ?? {} };
}

export async function getTripById(id: string): Promise<Trip> {
  const { data: response } = await api.get<ApiResponseWrapper<Trip>>(
    `/trips/${id}`
  );
  return response.data;
}

export async function getActiveTripsInArea(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number
): Promise<Trip[]> {
  const { data: response } = await api.get<ApiResponseWrapper<Trip[]>>(
    '/trips/area',
    { params: { swLat, swLng, neLat, neLng } }
  );
  return response.data;
}

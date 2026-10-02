import api from '@/lib/api';
import type { Hazard, HazardType, HazardSeverity, PaginationParams } from '@/types';

interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Record<string, unknown>;
}

interface ReportHazardData {
  hazardType: HazardType;
  severity: HazardSeverity;
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
  imageUrls?: string[];
}

interface VerifyHazardData {
  verified: boolean;
  notes?: string;
}

interface AssignHazardData {
  assignedToUserId: string;
  priority?: string;
}

interface ResolveHazardData {
  resolution?: string;
  maintenanceNotes?: string;
}

export async function reportHazard(data: ReportHazardData): Promise<Hazard> {
  const { data: response } = await api.post<ApiResponseWrapper<Hazard>>(
    '/hazards/report',
    data
  );
  return response.data;
}

export async function getNearbyHazards(
  lat: number,
  lng: number,
  radius: number = 5.0
): Promise<Hazard[]> {
  const { data: response } = await api.get<ApiResponseWrapper<Hazard[]>>(
    '/hazards/nearby',
    { params: { lat, lng, radius } }
  );
  return response.data;
}

export async function getHazardsInBounds(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number
): Promise<Hazard[]> {
  const { data: response } = await api.get<ApiResponseWrapper<Hazard[]>>(
    '/hazards/bounds',
    { params: { swLat, swLng, neLat, neLng } }
  );
  return response.data;
}

export async function getActiveHazards(): Promise<Hazard[]> {
  const { data: response } = await api.get<ApiResponseWrapper<Hazard[]>>(
    '/hazards/active'
  );
  return response.data;
}

export async function getHazardById(id: string): Promise<Hazard> {
  const { data: response } = await api.get<ApiResponseWrapper<Hazard>>(
    `/hazards/${id}`
  );
  return response.data;
}

export async function verifyHazard(
  id: string,
  data: VerifyHazardData
): Promise<Hazard> {
  const { data: response } = await api.post<ApiResponseWrapper<Hazard>>(
    `/hazards/${id}/verify`,
    data
  );
  return response.data;
}

export async function assignHazard(
  id: string,
  data: AssignHazardData
): Promise<Hazard> {
  const { data: response } = await api.post<ApiResponseWrapper<Hazard>>(
    `/hazards/${id}/assign`,
    data
  );
  return response.data;
}

export async function resolveHazard(
  id: string,
  data: ResolveHazardData
): Promise<Hazard> {
  const { data: response } = await api.post<ApiResponseWrapper<Hazard>>(
    `/hazards/${id}/resolve`,
    data
  );
  return response.data;
}

export async function getAllHazards(
  params: PaginationParams & { status?: string } = {}
): Promise<{ data: Hazard[]; pagination: Record<string, unknown> }> {
  const { data: response } = await api.get<ApiResponseWrapper<Hazard[]>>(
    '/hazards',
    { params }
  );
  return { data: response.data, pagination: response.pagination ?? {} };
}

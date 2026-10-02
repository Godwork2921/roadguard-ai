export type UserRole = 'DRIVER' | 'PASSENGER' | 'AUTHORITY_OFFICER' | 'ADMINISTRATOR';

export type HazardType =
  | 'POTHOLE'
  | 'ROAD_CRACK'
  | 'FLOOD'
  | 'ACCIDENT'
  | 'ROAD_BLOCKAGE'
  | 'CONSTRUCTION'
  | 'ANIMAL_CROSSING'
  | 'DEBRIS'
  | 'OTHER';

export type HazardSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type HazardStatus =
  | 'DETECTED'
  | 'REPORTED'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'FIXED'
  | 'RESOLVED'
  | 'REJECTED';

export type TripStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ABORTED';

export type NotificationType =
  | 'HAZARD_ALERT'
  | 'ROUTE_ALERT'
  | 'WEATHER_ALERT'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'VERIFICATION_REQUEST'
  | 'HAZARD_RESOLVED'
  | 'TRIP_SUMMARY'
  | 'SAFETY_TIP'
  | 'AUTHORITY_ALERT'
  | 'ANOMALY_DETECTED';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS';

export type AnomalyType =
  | 'HARSH_BRAKING'
  | 'HARSH_ACCELERATION'
  | 'SHARP_TURN'
  | 'SWERVING'
  | 'SPEEDING'
  | 'LANE_DEPARTURE'
  | 'ROUGH_ROAD'
  | 'OTHER';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  role: UserRole;
  region: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  startLat: number;
  startLng: number;
  endLat: number | null;
  endLng: number | null;
  startAddress: string | null;
  endAddress: string | null;
  startTime: string;
  endTime: string | null;
  status: TripStatus;
  riskScore: number | null;
  totalDistance: number | null;
  averageSpeed: number | null;
  maxSpeed: number | null;
}

export interface Hazard {
  id: string;
  hazardType: HazardType;
  severity: HazardSeverity;
  status: HazardStatus;
  latitude: number;
  longitude: number;
  description: string;
  address: string | null;
  confidenceScore: number | null;
  reportedById: string;
  reportedByName: string;
  verifiedById: string | null;
  verifiedByName: string | null;
  isVerified: boolean;
  isAIDetected: boolean;
  source: string;
  region: string | null;
  roadName: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  imageUrls: string[];
}

export interface HazardSummary {
  id: string;
  type: HazardType;
  severity: HazardSeverity;
  latitude: number;
  longitude: number;
  description: string;
  distance: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  priority: NotificationPriority;
  sentAt: string;
  channel: NotificationChannel;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  type: NotificationType;
  enabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export interface RouteAnalysis {
  id: string;
  userId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startAddress: string | null;
  endAddress: string | null;
  riskScore: number | null;
  totalDistance: number | null;
  estimatedDuration: number | null;
  hazardCount: number | null;
  safeRoute: boolean;
  routeGeometry: string | null;
  alternativeRoutes: number | null;
  analysisStatus: AnalysisStatus;
  errorMessage: string | null;
  requestedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RouteAnalysisResponse {
  routeId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  totalDistance: number;
  estimatedDuration: number;
  estimatedDurationFormatted: string;
  hazardCount: number;
  hazards: HazardSummary[];
  safeRoute: boolean;
  routeGeometry: string;
  alternativeRoutes: AlternativeRoute[];
  warnings: string[];
}

export interface AlternativeRoute {
  routeId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  totalDistance: number;
  estimatedDuration: number;
  hazardCount: number;
  routeGeometry: string;
}

export interface RiskZone {
  id: string;
  name: string;
  description: string | null;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  riskLevel: RiskLevel;
  hazardCount: number | null;
  incidentCount: number | null;
  isActive: boolean;
  region: string | null;
  lastIncidentAt: string | null;
  colorCode: string | null;
}

export interface AnomalyEvent {
  id: string;
  latitude: number;
  longitude: number;
  anomalyType: AnomalyType;
  severity: HazardSeverity;
  speed: number | null;
  acceleration: number | null;
  heading: number | null;
  driverId: string;
  tripId: string;
  confidenceScore: number | null;
  detectedAt: string;
  isVerified: boolean;
  isHazardCreated: boolean;
}

export interface AnomalyAggregation {
  latitude: number;
  longitude: number;
  type: AnomalyType;
  severity: HazardSeverity;
  count: number;
}

export interface TripLocation {
  id: string;
  tripId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  direction: number | null;
  altitude: number | null;
  accuracy: number | null;
  bearing: number | null;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination: PaginationMetadata | null;
  timestamp: string;
}

export interface PaginationMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface MapData {
  hazards: MapHazard[];
  riskZones: MapRiskZone[];
  activeTrips: MapActiveTrip[];
  anomalies: MapAnomaly[];
}

export interface MapHazard {
  id: string;
  type: HazardType;
  severity: HazardSeverity;
  latitude: number;
  longitude: number;
  status: HazardStatus;
  reportedAt: string;
  verifiedAt: string | null;
  resolvedAt: string | null;
  confidenceScore: number | null;
}

export interface MapRiskZone {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  colorCode: string | null;
}

export interface MapActiveTrip {
  id: string;
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  direction: number | null;
  timestamp: string;
}

export interface MapAnomaly {
  id: string;
  latitude: number;
  longitude: number;
  type: AnomalyType;
  severity: HazardSeverity;
  detectedAt: string;
  count: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  email: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
}

export interface DashboardStats {
  totalUsers: number;
  totalTrips: number;
  activeTrips: number;
  totalHazards: number;
  activeHazards: number;
  resolvedHazards: number;
  avgResponseTime: number | null;
  dailyActiveUsers: number;
  todayTrips: number;
  todayHazards: number;
  topDangerousRoads: RoadDangerStats[];
  hazardByType: Record<string, number>;
  hazardBySeverity: Record<string, number>;
  tripTrend: DataPoint[];
  hazardTrend: DataPoint[];
}

export interface RoadDangerStats {
  roadName: string;
  hazardCount: number;
  avgSeverity: number;
  riskScore: number;
  lat: number;
  lng: number;
}

export interface DataPoint {
  date: string;
  value: number;
  label: string;
}

export interface SystemHealth {
  status: string;
  uptime: string;
  activeUsers: number;
  activeTrips: number;
  pendingHazards: number;
  databaseStatus: string;
  redisStatus: string;
  aiServiceStatus: string;
  lastSyncCheck: string;
  memoryUsage: MemoryUsage;
  cpuUsage: number;
}

export interface MemoryUsage {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  updatedBy: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface OfflineSyncRequest {
  trips?: OfflineTrip[];
  locations?: OfflineLocation[];
  hazardReports?: OfflineHazardReport[];
  anomalies?: OfflineAnomaly[];
  deviceId?: string;
  lastSyncTime?: string;
}

export interface OfflineSyncResponse {
  syncedTrips: number;
  syncedLocations: number;
  syncedHazards: number;
  syncedAnomalies: number;
  conflicts: SyncConflict[];
  serverTime: string;
  syncToken: string;
}

export interface OfflineTrip {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startTime: string;
  endTime: string;
  totalDistance: number;
}

export interface OfflineLocation {
  tripId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export interface OfflineHazardReport {
  hazardType: HazardType;
  severity: HazardSeverity;
  latitude: number;
  longitude: number;
  description: string;
  timestamp: string;
}

export interface OfflineAnomaly {
  latitude: number;
  longitude: number;
  anomalyType: AnomalyType;
  severity: HazardSeverity;
  speed: number;
  timestamp: string;
}

export interface SyncConflict {
  entityType: string;
  entityId: string;
  clientVersion: string;
  serverVersion: string;
  resolution: 'KEEP_CLIENT' | 'KEEP_SERVER' | 'MERGE';
}

export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  plateNumber: string;
  type: string;
  make: string;
  model: string;
  year: number;
  color: string;
  isActive: boolean;
  createdAt: string;
}

export interface BoundingBox {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: string;
}

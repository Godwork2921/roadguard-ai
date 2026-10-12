import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refreshToken,
        });

        const newToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorage.setItem('access_token', newToken);
        localStorage.setItem('refresh_token', newRefreshToken);

        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
  }) => api.post('/auth/register', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
};

export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: Record<string, unknown>) => api.put('/users/me', data),
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => api.post('/users/me/change-password', data),
  getUser: (id: string) => api.get(`/users/${id}`),
  getUsers: (params?: Record<string, unknown>) =>
    api.get('/users', { params }),
  deactivateUser: (id: string) => api.delete(`/users/${id}`),
};

export const tripsApi = {
  startTrip: (data: {
    startLat: number;
    startLng: number;
    startAddress?: string;
    endLat: number;
    endLng: number;
    endAddress?: string;
    vehicleId?: string;
  }) => api.post('/trips/start', data),
  endTrip: (data: {
    tripId: string;
    endLat: number;
    endLng: number;
    endAddress?: string;
    totalDistance?: number;
    averageSpeed?: number;
    maxSpeed?: number;
  }) => api.post('/trips/end', data),
  getActiveTrip: () => api.get('/trips/active'),
  getTripHistory: (params?: Record<string, unknown>) =>
    api.get('/trips/history', { params }),
  getTrip: (id: string) => api.get(`/trips/${id}`),
  getActiveTripsInArea: (params: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => api.get('/trips/area', { params }),
};

export const gpsApi = {
  updateLocation: (data: {
    tripId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    direction?: number;
    altitude?: number;
    accuracy?: number;
    bearing?: number;
    timestamp: string;
  }) => api.post('/gps/location', data),
  getTripLocations: (tripId: string) =>
    api.get(`/gps/trips/${tripId}/locations`),
  getLatestLocation: (tripId: string) =>
    api.get(`/gps/trips/${tripId}/latest`),
  getLocationsInTimeRange: (
    tripId: string,
    start: string,
    end: string
  ) => api.get(`/gps/trips/${tripId}/locations/range`, {
    params: { start, end },
  }),
};

export const hazardsApi = {
  reportHazard: (data: {
    hazardType: string;
    severity: string;
    latitude: number;
    longitude: number;
    description?: string;
    address?: string;
    imageUrls?: string[];
  }) => api.post('/hazards/report', data),
  getNearbyHazards: (params: {
    lat: number;
    lng: number;
    radius?: number;
  }) => api.get('/hazards/nearby', { params }),
  getHazardsInBoundingBox: (params: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => api.get('/hazards/bounds', { params }),
  getActiveHazards: () => api.get('/hazards/active'),
  getHazard: (id: string) => api.get(`/hazards/${id}`),
  verifyHazard: (id: string, data: {
    verified: boolean;
    notes?: string;
  }) => api.post(`/hazards/${id}/verify`, data),
  assignHazard: (id: string, data: {
    assignedToUserId: string;
    priority?: string;
  }) => api.post(`/hazards/${id}/assign`, data),
  resolveHazard: (id: string, data: {
    resolution?: string;
    maintenanceNotes?: string;
  }) => api.post(`/hazards/${id}/resolve`, data),
  getAllHazards: (params?: Record<string, unknown>) =>
    api.get('/hazards', { params }),
};

export const routesApi = {
  analyzeRoute: (data: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    waypoints?: Array<{ lat: number; lng: number }>;
  }) => api.post('/routes/analyze', data),
  getHistory: (params?: Record<string, unknown>) =>
    api.get('/routes/history', { params }),
  getRoute: (id: string) => api.get(`/routes/${id}`),
  getRiskZones: (params: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => api.get('/routes/risk-zones', { params }),
};

export const notificationsApi = {
  getNotifications: (params?: Record<string, unknown>) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id: string) =>
    api.delete(`/notifications/${id}`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreference: (data: Record<string, unknown>) =>
    api.put('/notifications/preferences', data),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTripTrend: (params?: Record<string, unknown>) =>
    api.get('/analytics/trips/trend', { params }),
  getHazardTrend: (params?: Record<string, unknown>) =>
    api.get('/analytics/hazards/trend', { params }),
  getHazardByType: () => api.get('/analytics/hazards/by-type'),
  getHazardBySeverity: () => api.get('/analytics/hazards/by-severity'),
  getDangerousRoads: (params?: Record<string, unknown>) =>
    api.get('/analytics/roads/dangerous', { params }),
  queryAnalytics: (params?: Record<string, unknown>) =>
    api.get('/analytics/query', { params }),
};

export const mapApi = {
  getMapData: (params: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => api.get('/map/data', { params }),
  getMapHazards: (params: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => api.get('/map/hazards', { params }),
  getMapRiskZones: (params: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => api.get('/map/risk-zones', { params }),
};

export const syncApi = {
  sync: (data: Record<string, unknown>) => api.post('/sync', data),
  getSyncStatus: () => api.get('/sync/status'),
};

export const anomaliesApi = {
  reportAnomaly: (data: {
    latitude: number;
    longitude: number;
    anomalyType: string;
    severity?: string;
    speed?: number;
    heading?: number;
    tripId: string;
  }) => api.post('/anomalies/report', data),
  getAnomaliesByTrip: (tripId: string) =>
    api.get(`/anomalies/trip/${tripId}`),
  getHeatmap: (params: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => api.get('/anomalies/heatmap', { params }),
};
